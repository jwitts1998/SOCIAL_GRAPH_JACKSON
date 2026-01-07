import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StructuredTranscriptView from "@/components/StructuredTranscriptView";
import MeetingSummary from "@/components/MeetingSummary";
import PersonSection from "@/components/PersonSection";
import SuggestionCard from "@/components/SuggestionCard";
import IntroEmailPanel from "@/components/IntroEmailPanel";
import { ArrowLeft, Download, Sparkles, Loader2, Plus } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useConversation, useConversationSegments, useConversationEntities } from "@/hooks/useConversations";
import { useMatchSuggestions, useUpdateMatchStatus } from "@/hooks/useMatches";
import { 
  useConversationTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask, 
  useCompleteTask, 
  useArchiveTask 
} from "@/hooks/useTasks";
import { extractEntities, generateMatches, generateSummary } from "@/lib/edgeFunctions";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface PromisedIntro {
  id: string;
  contactName: string;
  promisedDate: string;
  fulfilled: boolean;
}

export default function ConversationDetail() {
  const [, params] = useRoute("/conversation/:id");
  const conversationId = params?.id || '';
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [promisedIntros, setPromisedIntros] = useState<Record<string, PromisedIntro[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { data: segments = [], isLoading: segmentsLoading } = useConversationSegments(conversationId);
  const { data: entities = [], isLoading: entitiesLoading } = useConversationEntities(conversationId);
  const { data: matches = [], isLoading: matchesLoading } = useMatchSuggestions(conversationId);
  const { data: tasks = [], isLoading: tasksLoading } = useConversationTasks(conversationId);
  const updateStatus = useUpdateMatchStatus(conversationId);
  
  const createTask = useCreateTask(conversationId);
  const updateTask = useUpdateTask(conversationId);
  const deleteTask = useDeleteTask(conversationId);
  const completeTask = useCompleteTask(conversationId);
  const archiveTask = useArchiveTask(conversationId);
  
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const transcript = useMemo(() => {
    return segments
      .filter(segment => segment.timestampMs != null)
      .map(segment => ({
        t: new Date(segment.timestampMs).toISOString(),
        speaker: segment.speaker || 'Unknown',
        text: segment.text,
      }));
  }, [segments]);

  const conversationTitle = conversation?.title || 'Conversation';
  const conversationDate = conversation?.recordedAt 
    ? format(conversation.recordedAt, 'MMMM dd, yyyy')
    : '';
  
  const duration = conversation?.durationSeconds || 0;
  const durationMinutes = Math.round(duration / 60);

  const handlePromiseIntro = (participant: string, contactName: string) => {
    const newPromise: PromisedIntro = {
      id: `${Date.now()}-${Math.random()}`,
      contactName,
      promisedDate: new Date().toISOString(),
      fulfilled: false,
    };
    setPromisedIntros(prev => ({
      ...prev,
      [participant]: [...(prev[participant] || []), newPromise]
    }));
    toast({
      title: "Intro promised!",
      description: `You promised to introduce ${participant} to ${contactName}`,
    });
  };

  const handleMarkFulfilled = (participant: string, promiseId: string) => {
    setPromisedIntros(prev => {
      const updated = { ...prev };
      updated[participant] = (updated[participant] || []).map(promise =>
        promise.id === promiseId ? { ...promise, fulfilled: true } : promise
      );
      return updated;
    });
    toast({
      title: "Intro completed!",
      description: "Marked intro as complete",
    });
  };

  const getPersonPromises = (personName: string) => {
    const promised = promisedIntros[personName] || [];
    return promised.map(promise => ({
      ...promise,
      onMarkFulfilled: () => handleMarkFulfilled(personName, promise.id),
    }));
  };

  const handleUpdateStatus = async (matchId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ matchId, status });
      const statusLabels: Record<string, string> = {
        promised: 'Intro promised!',
        maybe: 'Marked as maybe',
        dismissed: 'Match dismissed',
      };
      toast({
        title: statusLabels[status] || 'Status updated',
        description: status === 'promised' 
          ? 'You can now draft an introduction email' 
          : undefined,
      });
    } catch (error) {
      toast({
        title: "Error updating match",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleProcessConversation = async () => {
    if (!conversationId || segments.length === 0) {
      toast({
        title: "Cannot process",
        description: "No transcript segments found",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('🔍 Extracting entities from conversation...');
      const entityData = await extractEntities(conversationId);
      console.log('✅ Entities extracted:', entityData);
      
      console.log('🎯 Generating matches...');
      const matchData = await generateMatches(conversationId);
      console.log('✅ Match generation response:', matchData);
      
      // Invalidate queries to refresh matches
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'matches'] });
      
      toast({
        title: "Processing complete!",
        description: matchData.matches && matchData.matches.length > 0
          ? `Found ${matchData.matches.length} match${matchData.matches.length !== 1 ? 'es' : ''}`
          : "No matches found. Check the Suggested Intros tab.",
      });
    } catch (error) {
      console.error('❌ Processing error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process conversation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!conversationId || segments.length === 0) {
      toast({
        title: "Cannot generate summary",
        description: "No transcript segments found",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSummary(true);
    try {
      console.log('📝 Generating conversation summary...');
      const summaryData = await generateSummary(conversationId);
      console.log('✅ Summary generated:', summaryData);
      
      // Invalidate conversation query to refresh with new summary
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId] });
      
      toast({
        title: "Summary generated!",
        description: "The conversation summary has been created successfully.",
      });
    } catch (error) {
      console.error('❌ Summary generation error:', error);
      toast({
        title: "Summary generation failed",
        description: error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const isLoading = conversationLoading || segmentsLoading || matchesLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/history">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </Link>
        </div>
        <div className="bg-card rounded-lg border border-card-border p-8 text-center text-muted-foreground">
          Loading conversation...
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/history">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </Link>
        </div>
        <div className="bg-card rounded-lg border border-card-border p-8 text-center text-muted-foreground">
          Conversation not found
        </div>
      </div>
    );
  }

  const handleSendEmail = (to: string, message: string) => {
    console.log('Sending email to:', to);
    console.log('Message:', message);
    toast({
      title: "Email sent!",
      description: `Introduction email sent to ${to}`,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/history">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{conversationTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{conversationDate}</span>
              {durationMinutes > 0 && (
                <>
                  <span>•</span>
                  <span>{durationMinutes} {durationMinutes === 1 ? 'minute' : 'minutes'}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={handleProcessConversation}
              disabled={isProcessing || segments.length === 0}
              data-testid="button-process"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Process Conversation
                </>
              )}
            </Button>
            <Button variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="suggestions" data-testid="tab-suggestions">Suggested Intros</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="emails" data-testid="tab-emails">Intro Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* DEBUG: Extracted Entities */}
            <div className="bg-card border border-card-border rounded-lg p-6 border-orange-500/50">
              <h2 className="text-lg font-semibold mb-4 text-orange-600">
                🔍 DEBUG: Extracted Entities ({entities.length})
              </h2>
              {entitiesLoading ? (
                <div className="text-sm text-muted-foreground">Loading entities...</div>
              ) : entities.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No entities extracted yet. Click "Process Conversation" to extract entities.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    entities.reduce((acc, entity) => {
                      if (!acc[entity.entityType]) acc[entity.entityType] = [];
                      acc[entity.entityType].push(entity);
                      return acc;
                    }, {} as Record<string, typeof entities>)
                  ).map(([entityType, entitiesOfType]) => (
                    <div key={entityType} className="space-y-2">
                      <div className="text-sm font-medium text-foreground capitalize">
                        {entityType.replace(/_/g, ' ')} ({entitiesOfType.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entitiesOfType.map((entity) => (
                          <div
                            key={entity.id}
                            className="text-xs bg-muted px-2 py-1 rounded border border-border"
                            title={entity.contextSnippet || entity.value}
                          >
                            <span className="font-medium">{entity.value}</span>
                            {entity.confidence && (
                              <span className="text-muted-foreground ml-1">
                                ({Math.round(entity.confidence * 100)}%)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {entitiesOfType.some(e => e.contextSnippet) && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer">Show context snippets</summary>
                          <div className="mt-2 space-y-1 pl-4">
                            {entitiesOfType
                              .filter(e => e.contextSnippet)
                              .map((entity) => (
                                <div key={entity.id} className="border-l-2 border-muted pl-2">
                                  <span className="font-medium">{entity.value}:</span>{' '}
                                  <span className="italic">"{entity.contextSnippet}"</span>
                                </div>
                              ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="bg-card border border-card-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold">Conversation Summary</h2>
                {!conversation?.summary && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || segments.length === 0}
                  >
                    {isGeneratingSummary ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                )}
              </div>
              {conversation?.summary ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{conversation.summary}</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {segments.length === 0 
                    ? "No transcript available. Generate a summary after the conversation is transcribed."
                    : "No summary available yet. Click 'Generate Summary' to create one using AI."}
                </div>
              )}
            </div>

            {/* Transcript Section */}
            {transcript.length > 0 ? (
              <div className="bg-card border border-card-border rounded-lg min-h-[600px]">
                <StructuredTranscriptView 
                  transcript={transcript}
                  conversationTitle={conversationTitle}
                  conversationDate={conversation.recordedAt}
                />
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-lg p-8 text-center text-muted-foreground">
                No transcript available. This conversation may not have been transcribed yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggestions">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Suggested Intro Matches</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Based on the conversation, here are potential introductions you could make.
            </p>
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id}>
                    <SuggestionCard
                      contact={{
                        name: match.contact?.name || 'Unknown',
                        email: match.contact?.email || null,
                        company: match.contact?.company || null,
                        title: match.contact?.title || null,
                      }}
                      score={match.score as (1 | 2 | 3)}
                      reasons={(match.reasons as string[]) || []}
                      status={match.status}
                      onPromise={() => handleUpdateStatus(match.id, 'promised')}
                      onMaybe={() => handleUpdateStatus(match.id, 'maybe')}
                      onDismiss={() => handleUpdateStatus(match.id, 'dismissed')}
                      isPending={updateStatus.isPending}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No match suggestions yet. Process the conversation to extract entities and generate matches.
                </p>
                <Button 
                  onClick={handleProcessConversation}
                  disabled={isProcessing || segments.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Process Conversation
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Tasks & Action Items</h2>
                <p className="text-sm text-muted-foreground">
                  Actionable items extracted from this conversation
                </p>
              </div>
              <Button 
                onClick={() => {
                  setEditingTask(null);
                  setTaskFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {tasksLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-8 text-center text-muted-foreground">
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-card border border-card-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No tasks found. Tasks are automatically extracted when a conversation ends, or you can create them manually.
                </p>
                <Button 
                  onClick={() => {
                    setEditingTask(null);
                    setTaskFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Filter by status */}
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'in_progress', 'completed', 'archived'].map((status) => {
                    const count = tasks.filter(t => t.status === status).length;
                    if (count === 0) return null;
                    return (
                      <Badge key={status} variant="outline" className="capitalize">
                        {status.replace('_', ' ')}: {count}
                      </Badge>
                    );
                  })}
                </div>

                {/* Tasks list */}
                <div className="space-y-3">
                  {tasks
                    .filter(t => t.status !== 'archived')
                    .map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => {
                          setEditingTask(task);
                          setTaskFormOpen(true);
                        }}
                        onDelete={async () => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            try {
                              await deleteTask.mutateAsync(task.id);
                              toast({
                                title: "Task deleted",
                                description: "The task has been removed",
                              });
                            } catch (error) {
                              toast({
                                title: "Error deleting task",
                                description: "Please try again",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                        onComplete={async () => {
                          try {
                            await completeTask.mutateAsync(task.id);
                            toast({
                              title: "Task completed",
                              description: "Great job!",
                            });
                          } catch (error) {
                            toast({
                              title: "Error completing task",
                              description: "Please try again",
                              variant: "destructive",
                            });
                          }
                        }}
                        onArchive={async () => {
                          try {
                            await archiveTask.mutateAsync(task.id);
                            toast({
                              title: "Task archived",
                              description: "The task has been archived",
                            });
                          } catch (error) {
                            toast({
                              title: "Error archiving task",
                              description: "Please try again",
                              variant: "destructive",
                            });
                          }
                        }}
                        onStatusChange={async (status) => {
                          try {
                            await updateTask.mutateAsync({
                              taskId: task.id,
                              updates: { status } as any,
                            });
                            toast({
                              title: "Task updated",
                              description: "Status has been changed",
                            });
                          } catch (error) {
                            toast({
                              title: "Error updating task",
                              description: "Please try again",
                              variant: "destructive",
                            });
                          }
                        }}
                        isPending={updateTask.isPending || deleteTask.isPending || completeTask.isPending || archiveTask.isPending}
                      />
                    ))}
                </div>

                {/* Archived tasks (collapsed) */}
                {tasks.filter(t => t.status === 'archived').length > 0 && (
                  <details className="mt-6">
                    <summary className="text-sm text-muted-foreground cursor-pointer mb-3">
                      Archived Tasks ({tasks.filter(t => t.status === 'archived').length})
                    </summary>
                    <div className="space-y-3">
                      {tasks
                        .filter(t => t.status === 'archived')
                        .map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={() => {
                              setEditingTask(task);
                              setTaskFormOpen(true);
                            }}
                            onDelete={async () => {
                              if (confirm('Are you sure you want to delete this task?')) {
                                try {
                                  await deleteTask.mutateAsync(task.id);
                                  toast({
                                    title: "Task deleted",
                                    description: "The task has been removed",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error deleting task",
                                    description: "Please try again",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            isPending={deleteTask.isPending}
                          />
                        ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="emails">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-card-border rounded-lg p-8 text-center text-muted-foreground">
              Introduction email generation coming soon
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Form Dialog */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        onSubmit={async (taskData) => {
          try {
            if (editingTask) {
              await updateTask.mutateAsync({
                taskId: editingTask.id,
                updates: taskData as any,
              });
              toast({
                title: "Task updated",
                description: "Your task has been updated",
              });
            } else {
              await createTask.mutateAsync(taskData);
              toast({
                title: "Task created",
                description: "Your new task has been added",
              });
            }
            setEditingTask(null);
          } catch (error) {
            toast({
              title: editingTask ? "Error updating task" : "Error creating task",
              description: "Please try again",
              variant: "destructive",
            });
            throw error;
          }
        }}
        task={editingTask}
        conversationId={conversationId}
      />
    </div>
  );
}
