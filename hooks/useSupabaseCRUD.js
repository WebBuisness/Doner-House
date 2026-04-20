import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * Custom hook for CRUD operations with error handling
 * @param {string} table - Table name
 * @returns {object} CRUD methods and state
 */
export function useSupabaseCRUD(table) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const fetch = useCallback(
    async (options = {}) => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from(table).select(options.select || '*');

        if (options.eq) {
          Object.entries(options.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (options.order) {
          query = query.order(options.order.column, {
            ascending: options.order.ascending !== false,
          });
        }

        const { data: result, error: err } = await query;

        if (err) throw err;
        setData(result || []);
        return { success: true, data: result || [] };
      } catch (err) {
        console.error(`Error fetching ${table}:`, err);
        setError(err.message);
        toast.error(`Failed to load ${table}`);
        return { success: false, error: err };
      } finally {
        setLoading(false);
      }
    },
    [table, supabase]
  );

  const create = useCallback(
    async (payload) => {
      try {
        setError(null);
        const { data: result, error: err } = await supabase
          .from(table)
          .insert(payload)
          .select()
          .single();

        if (err) throw err;
        setData((prev) => [result, ...prev]);
        toast.success(`Created successfully`);
        return { success: true, data: result };
      } catch (err) {
        console.error(`Error creating ${table}:`, err);
        setError(err.message);
        toast.error(err.message);
        return { success: false, error: err };
      }
    },
    [table, supabase]
  );

  const update = useCallback(
    async (id, payload) => {
      try {
        setError(null);
        const { data: result, error: err } = await supabase
          .from(table)
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (err) throw err;
        setData((prev) => prev.map((item) => (item.id === id ? result : item)));
        toast.success(`Updated successfully`);
        return { success: true, data: result };
      } catch (err) {
        console.error(`Error updating ${table}:`, err);
        setError(err.message);
        toast.error(err.message);
        return { success: false, error: err };
      }
    },
    [table, supabase]
  );

  const remove = useCallback(
    async (id) => {
      try {
        setError(null);
        const { error: err } = await supabase.from(table).delete().eq('id', id);

        if (err) throw err;
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success(`Deleted successfully`);
        return { success: true };
      } catch (err) {
        console.error(`Error deleting ${table}:`, err);
        setError(err.message);
        toast.error(err.message);
        return { success: false, error: err };
      }
    },
    [table, supabase]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    fetch,
    create,
    update,
    remove,
    clearError,
  };
}
