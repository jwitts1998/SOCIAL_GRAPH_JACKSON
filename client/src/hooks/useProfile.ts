import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { profileFromDb, profileToDb, preferencesFromDb, preferencesToDb } from '@/lib/supabaseHelpers';
import type { Profile, UserPreferences } from '@shared/schema';

export function useProfile() {
  return useQuery<Profile | null>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        // PGRST116 = not found (no row returned)
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for user, attempting to create...');
          // Profile doesn't exist, try to create it
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || null,
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating profile:', createError);
              return null;
            }
            
            // Also create user_preferences
            await supabase
              .from('user_preferences')
              .insert({ profile_id: user.id });
            
            return profileFromDb(newProfile);
          } catch (createErr) {
            console.error('Error creating profile:', createErr);
            return null;
          }
        }
        
        // Log unexpected errors for debugging
        console.error('Error fetching profile:', error);
        
        // For 400/406 errors, return null instead of throwing
        if (error.message?.includes('400') || error.message?.includes('406')) {
          console.warn('Profile query failed with 400/406, returning null');
          return null;
        }
        
        throw error;
      }
      return profileFromDb(data);
    },
  });
}

export function useUserPreferences() {
  return useQuery<UserPreferences | null>({
    queryKey: ['/api/preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('profile_id', user.id)
        .single();
      
      if (error) {
        // PGRST116 = not found (no row returned)
        if (error.code === 'PGRST116') return null;
        
        // Log unexpected errors for debugging
        console.error('Error fetching user preferences:', error);
        
        // For 400/406 errors, return null instead of throwing
        // This allows the UI to continue working even if preferences aren't available
        if (error.message?.includes('400') || error.message?.includes('406')) {
          console.warn('User preferences query failed with 400/406, returning null');
          return null;
        }
        
        throw error;
      }
      return preferencesFromDb(data);
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dbUpdates = profileToDb(updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return profileFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
  });
}

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dbUpdates = preferencesToDb(updates);

      const { data, error} = await supabase
        .from('user_preferences')
        .update(dbUpdates)
        .eq('profile_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return preferencesFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
    },
  });
}
