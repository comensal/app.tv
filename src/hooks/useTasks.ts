import { useState, useEffect } from 'react';
import { supabase, type Task } from '../lib/supabase';

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setError(null);
        const { data, error: err } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setTasks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const addTask = async (title: string, description: string = '') => {
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
      setError(null);
      const { error: err } = await supabase
        .from('tasks')
        .insert([{
          user_id: userId,
          title,
          description,
          completed: false
        }]);

      if (err) throw err;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add task';
      setError(message);
      return { success: false, error: message };
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (err) throw err;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      setError(message);
      return { success: false, error: message };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (err) throw err;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      return { success: false, error: message };
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask
  };
}
