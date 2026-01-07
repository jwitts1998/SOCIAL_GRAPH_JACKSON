import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import TranscriptView from "@/components/TranscriptView";
import SuggestionCard from "@/components/SuggestionCard";
import { Mic, Square, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import {
  useCreateConversation,
  useUpdateConversation,
} from "@/hooks/useConversations";
import {
  transcribeAudio,
  extractParticipants,
  extractEntities,
  generateMatches,
  processParticipants,
  extractTasks,
  generateSummary,
} from "@/lib/edgeFunctions";
import { supabase } from "@/lib/supabase";

interface TranscriptEntry {
  t: string;
  speaker: string | null;
  text: string;
}

interface Suggestion {
  contact: {
    name: string;
    email: string | null;
    company: string | null;
    title: string | null;
  };
  score: 1 | 2 | 3;
  reasons: string[];
}

interface RecordingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string | null;
}

export default function RecordingDrawer({ open, onOpenChange, eventId }: RecordingDrawerProps) {
  const [title, setTitle] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const lastExtractTimeRef = useRef<number>(Date.now());
  const lastMatchTimeRef = useRef<number>(Date.now());
  const audioQueueRef = useRef<Blob[]>([]);
  const isUploadingRef = useRef(false);
  const transcriptLengthRef = useRef<number>(0);

  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createConversation = useCreateConversation();
  const updateConversation = useUpdateConversation();

  const handleAudioData = useCallback(async (audioBlob: Blob) => {
    if (!conversationIdRef.current) return;

    console.log('✅ Audio chunk received:', audioBlob.size, 'bytes');
    audioQueueRef.current.push(audioBlob);

    if (!isUploadingRef.current) {
      await processAudioQueue();
    }
  }, []);

  const processAudioQueue = async () => {
    const currentConversationId = conversationIdRef.current;
    if (audioQueueRef.current.length === 0 || !currentConversationId) return;

    isUploadingRef.current = true;
    setIsTranscribing(true);

    try {
      const blob = audioQueueRef.current.shift();
      if (!blob) return;

      const result = await transcribeAudio(blob, currentConversationId);
      console.log('✅ Transcription result:', result);

      if (audioQueueRef.current.length > 0) {
        await processAudioQueue();
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      toast({
        title: "Transcription error",
        description: error instanceof Error ? error.message : "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      isUploadingRef.current = false;
      setIsTranscribing(false);
    }
  };

  const { state: audioState, controls: audioControls } = useAudioRecorder(handleAudioData);

  const formattedDuration = `${Math.floor(audioState.duration / 60)}:${String(audioState.duration % 60).padStart(2, '0')}`;

  const handleStartRecording = async () => {
    if (!consentChecked) {
      toast({
        title: "Consent required",
        description: "Please confirm you have consent to record",
        variant: "destructive",
      });
      return;
    }

    console.log('🎬 Starting recording...');
    console.log('📝 Creating conversation...');

    const result = await createConversation.mutateAsync({
      title: title || `Conversation - ${new Date().toLocaleString()}`,
      recordedAt: new Date(),
      status: 'recording',
      eventId: eventId || null,
      ownedByProfile: '',
    } as any);

    if (!result || !result.id) {
      toast({
        title: "Failed to create conversation",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Conversation created:', result.id);
    setConversationId(result.id);
    conversationIdRef.current = result.id;
    // Reset timing refs when starting a new recording
    const startTime = Date.now();
    lastExtractTimeRef.current = startTime;
    lastMatchTimeRef.current = startTime;
    console.log('⏱️ Reset polling timers to:', new Date(startTime).toISOString());

    console.log('🎤 Starting audio recorder...');
    await audioControls.startRecording();
  };

  const handleStop = async () => {
    if (!conversationIdRef.current) return;
    
    console.log('⏹ Stopping recording...');
    setIsProcessing(true);
    
    try {
      const finalBlob = await audioControls.stopRecording();
      
      if (finalBlob && finalBlob.size > 0) {
        await transcribeAudio(finalBlob, conversationIdRef.current);
      }
      
      await updateConversation.mutateAsync({
        id: conversationIdRef.current,
        status: 'processing',
      });
      
      await processParticipants(conversationIdRef.current);
      
      // Extract tasks from conversation
      console.log('📋 Extracting tasks...');
      try {
        const taskData = await extractTasks(conversationIdRef.current);
        console.log(`✅ Extracted ${taskData.extracted_count || 0} tasks`);
      } catch (error) {
        console.error('❌ Task extraction error:', error);
        // Don't fail the whole flow if task extraction fails
      }
      
      // Generate summary (includes tasks)
      console.log('📝 Generating summary...');
      try {
        await generateSummary(conversationIdRef.current);
        console.log('✅ Summary generated');
      } catch (error) {
        console.error('❌ Summary generation error:', error);
        // Don't fail the whole flow if summary generation fails
      }
      
      await updateConversation.mutateAsync({
        id: conversationIdRef.current,
        status: 'completed',
      });

      toast({
        title: "Conversation processed!",
        description: "Transcript, tasks, and summary have been generated",
      });

      setLocation(`/conversation/${conversationIdRef.current}`);
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to stop recording",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }

    onOpenChange(false);
    resetState();
  };

  const handlePause = () => {
    if (audioState.isPaused) {
      audioControls.resumeRecording();
    } else {
      audioControls.pauseRecording();
    }
  };

  const resetState = () => {
    setTitle("");
    setConsentChecked(false);
    setConversationId(null);
    setTranscript([]);
    setSuggestions([]);
    conversationIdRef.current = null;
    lastExtractTimeRef.current = Date.now();
    lastMatchTimeRef.current = Date.now();
    transcriptLengthRef.current = 0;
    audioQueueRef.current = [];
  };

  useEffect(() => {
    if (!open && audioState.isRecording) {
      handleStop();
    }
  }, [open]);

  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_segments',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const segment = payload.new;
          setTranscript((prev) => {
            const newTranscript = [
              ...prev,
              {
                t: segment.timestamp_ms ? new Date(parseInt(segment.timestamp_ms)).toLocaleTimeString() : '',
                speaker: null,
                text: segment.text || '',
              },
            ];
            transcriptLengthRef.current = newTranscript.length;
            return newTranscript;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_suggestions',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const match = payload.new;
          
          // Fetch the contact details for this match
          const { data: contactData, error } = await supabase
            .from('contacts')
            .select('name, email, company, title')
            .eq('id', match.contact_id)
            .single();
          
          // Guard against missing or failed contact fetch
          if (error || !contactData) {
            console.error('Failed to fetch contact for match:', error);
            toast({
              title: "Error loading contact",
              description: "Failed to load contact details for a new match",
              variant: "destructive",
            });
            return;
          }
          
          setSuggestions((prev) => [
            ...prev,
            {
              contact: {
                name: contactData.name,
                email: contactData.email,
                company: contactData.company,
                title: contactData.title,
              },
              score: (match.score || 1) as 1 | 2 | 3,
              reasons: match.reasons || [],
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !audioState.isRecording || audioState.isPaused) {
      console.log('⏸️ Polling paused:', { 
        conversationId, 
        isRecording: audioState.isRecording, 
        isPaused: audioState.isPaused 
      });
      return;
    }

    console.log('▶️ Starting polling interval for conversation:', conversationId);
    console.log('📊 Initial state:', { 
      transcriptLength: transcriptLengthRef.current,
      lastExtractTime: lastExtractTimeRef.current,
      lastMatchTime: lastMatchTimeRef.current,
      timeSinceLastExtract: Date.now() - lastExtractTimeRef.current,
      timeSinceLastMatch: Date.now() - lastMatchTimeRef.current
    });

    const interval = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastExtract = now - lastExtractTimeRef.current;
      const timeSinceLastMatch = now - lastMatchTimeRef.current;
      
      // Log every 5 seconds, but only detailed info every 10 seconds to reduce noise
      const shouldLogDetailed = Math.floor(timeSinceLastMatch / 10000) !== Math.floor((timeSinceLastMatch - 5000) / 10000);
      
      if (shouldLogDetailed || timeSinceLastExtract >= 30000 || timeSinceLastMatch >= 30000) {
        console.log('🔄 Polling check:', {
          transcriptLength: transcriptLengthRef.current,
          timeSinceLastExtract: `${Math.floor(timeSinceLastExtract / 1000)}s`,
          timeSinceLastMatch: `${Math.floor(timeSinceLastMatch / 1000)}s`,
          shouldExtract: timeSinceLastExtract >= 30000 && transcriptLengthRef.current > 0,
          shouldMatch: timeSinceLastMatch >= 30000 && transcriptLengthRef.current > 0,
          waitingFor: timeSinceLastMatch < 30000 ? `${30 - Math.floor(timeSinceLastMatch / 1000)}s until next check` : 'READY'
        });
      }
      
      // Participant extraction (every 30s)
      if (timeSinceLastExtract >= 30000 && transcriptLengthRef.current > 0) {
        console.log(`⏰ 30s elapsed (${Math.floor(timeSinceLastExtract / 1000)}s), extracting participants...`);
        console.log('⏰ 30s elapsed, extracting participants...');
        try {
          await extractParticipants(conversationId);
          lastExtractTimeRef.current = now;
          console.log('✅ Participant extraction completed');
        } catch (error) {
          console.error('❌ Participant extraction error:', error);
          toast({
            title: "Participant extraction failed",
            description: error instanceof Error ? error.message : "Failed to extract participants",
            variant: "destructive",
          });
        }
      }
      
      // Entity extraction and matching (every 30s)
      if (timeSinceLastMatch >= 30000 && transcriptLengthRef.current > 0) {
        console.log(`⏰ 30s elapsed (${Math.floor(timeSinceLastMatch / 1000)}s), starting entity extraction and matching...`);
        try {
          console.log('🔍 Extracting entities...');
          const entityData = await extractEntities(conversationId);
          console.log('✅ Entities extracted:', entityData?.entities?.length || 0);
          
          // Only generate matches if we have entities
          if (entityData?.entities && entityData.entities.length > 0) {
            console.log('🎯 Generating matches...');
            const matchData = await generateMatches(conversationId);
            
            if (matchData.matches && matchData.matches.length > 0) {
              console.log(`🎉 Found ${matchData.matches.length} matches!`);
              const newSuggestions = matchData.matches.map((m: any) => ({
                contact: {
                  name: m.contact_name || 'Unknown',
                  email: m.contact_email || null,
                  company: m.contact_company || null,
                  title: m.contact_title || null,
                },
                score: m.score,
                reasons: m.reasons || [],
              }));
              
              setSuggestions(newSuggestions);
              
              const highValueMatches = newSuggestions.filter((s: Suggestion) => s.score === 3);
              if (highValueMatches.length > 0) {
                toast({
                  title: "New match found!",
                  description: `${highValueMatches[0].contact.name} - ${highValueMatches[0].score} stars`,
                });
              }
            } else {
              console.log('ℹ️ No matches found this cycle');
            }
          } else {
            console.log('ℹ️ No entities found, skipping match generation');
          }
          
          lastMatchTimeRef.current = now;
          console.log('✅ Match generation cycle completed');
        } catch (error) {
          console.error('❌ Match generation error:', error);
          toast({
            title: "Match generation failed",
            description: error instanceof Error ? error.message : "Failed to generate matches",
            variant: "destructive",
          });
        }
      }
    }, 5000);

    return () => {
      console.log('🛑 Clearing polling interval');
      clearInterval(interval);
    };
  }, [conversationId, audioState.isRecording, audioState.isPaused, toast]);

  const isRecording = audioState.isRecording;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[50vh]">
        <DrawerHeader>
          <DrawerTitle>{isRecording ? 'Recording in Progress' : 'New Meeting'}</DrawerTitle>
        </DrawerHeader>

        {isProcessing ? (
          <div className="px-4 flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-full max-w-md space-y-3">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-3/4"></div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Processing conversation and generating matches...
              </p>
              <p className="text-xs text-center text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          </div>
        ) : !isRecording ? (
          <div className="px-4 space-y-4 overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="Enter title or we will auto fill once the meeting begins"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-meeting-title"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <Checkbox
                id="consent-drawer"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                data-testid="checkbox-consent"
              />
              <label htmlFor="consent-drawer" className="text-sm cursor-pointer select-none">
                I have consent from all parties to record this conversation
              </label>
            </div>
          </div>
        ) : (
          <div className="px-4 flex-1 overflow-auto">

            <Tabs defaultValue="transcript" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="transcript">
                  Transcript {transcript.length > 0 && `(${transcript.length})`}
                </TabsTrigger>
                <TabsTrigger value="matches">
                  Matches {suggestions.length > 0 && `(${suggestions.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transcript">
                <Card className="p-0 h-48 overflow-auto">
                  {transcript.length > 0 ? (
                    <TranscriptView transcript={transcript} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                      <Mic className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm text-center">Waiting for audio transcription...</p>
                      <p className="text-xs text-center mt-1">Speak to see the transcript</p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="matches">
                <div className="space-y-2 h-48 overflow-auto">
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, idx) => (
                      <SuggestionCard 
                        key={idx} 
                        contact={suggestion.contact}
                        score={suggestion.score}
                        reasons={suggestion.reasons}
                        onPromise={() => console.log('Promise', suggestion.contact.name)}
                        onMaybe={() => console.log('Maybe', suggestion.contact.name)}
                        onDismiss={() => console.log('Dismiss', suggestion.contact.name)}
                      />
                    ))
                  ) : (
                    <Card className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 border-dashed">
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm text-center">No matches yet</p>
                      <p className="text-xs text-center mt-1">Continue talking to discover connections</p>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DrawerFooter>
          <div className="flex items-center justify-between w-full gap-4">
            {isProcessing ? null : isRecording ? (
              <>
                <Button
                  variant="outline"
                  onClick={handlePause}
                  data-testid="button-pause-resume"
                >
                  {audioState.isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleStop}
                  data-testid="button-stop"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!consentChecked || createConversation.isPending}
                  onClick={handleStartRecording}
                  data-testid="button-start"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {createConversation.isPending ? 'Starting...' : 'Start'}
                </Button>
              </>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
