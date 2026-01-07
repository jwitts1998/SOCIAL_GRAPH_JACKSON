import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ConversationTask, InsertConversationTask } from "@shared/schema";

export function useConversationTasks(conversationId: string) {
  return useQuery({
    queryKey: ['conversation-tasks', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_tasks')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as ConversationTask[];
    },
    enabled: !!conversationId,
  });
}

export function useCreateTask(conversationId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: Omit<InsertConversationTask, "conversationId" | "createdBy">) => {
      const { data, error } = await supabase
        .from('conversation_tasks')
        .insert({
          ...task,
          conversation_id: conversationId,
          created_by: 'user',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ConversationTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-tasks', conversationId] });
    },
  });
}

export function useUpdateTask(conversationId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<ConversationTask> }) => {
      const { data, error } = await supabase
        .from('conversation_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data as ConversationTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-tasks', conversationId] });
    },
  });
}

export function useDeleteTask(conversationId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('conversation_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-tasks', conversationId] });
    },
  });
}

export function useCompleteTask(conversationId: string) {
  const updateTask = useUpdateTask(conversationId);
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      return updateTask.mutateAsync({
        taskId,
        updates: {
          status: 'completed',
          completed_at: new Date().toISOString(),
        } as any,
      });
    },
  });
}

export function useArchiveTask(conversationId: string) {
  const updateTask = useUpdateTask(conversationId);
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      return updateTask.mutateAsync({
        taskId,
        updates: {
          status: 'archived',
          archived_at: new Date().toISOString(),
        } as any,
      });
    },
  });
}

