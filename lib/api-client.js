import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

class ApiClient {
  constructor() {
    this.supabase = createClient();
  }

  /**
   * Fetch data from a Supabase table
   * @param {string} table - Table name
   * @param {object} options - Query options (select, eq, order, etc.)
   * @returns {Promise<{data: any[], error: Error | null}>}
   */
  async fetch(table, options = {}) {
    try {
      let query = this.supabase.from(table).select(options.select || '*');

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

      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      return { data: [], error };
    }
  }

  /**
   * Insert a record
   * @param {string} table - Table name
   * @param {object} payload - Data to insert
   * @returns {Promise<{data: any, error: Error | null}>}
   */
  async insert(table, payload) {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Update a record
   * @param {string} table - Table name
   * @param {object} payload - Data to update
   * @param {object} where - Where clause (e.g., { id: '123' })
   * @returns {Promise<{data: any, error: Error | null}>}
   */
  async update(table, payload, where) {
    try {
      let query = this.supabase.from(table).update(payload);

      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Delete a record
   * @param {string} table - Table name
   * @param {object} where - Where clause
   * @returns {Promise<{error: Error | null}>}
   */
  async delete(table, where) {
    try {
      let query = this.supabase.from(table).delete();

      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return { error };
    }
  }

  /**
   * Batch update records
   * @param {string} table - Table name
   * @param {array} updates - Array of {data, where} objects
   * @returns {Promise<{success: boolean, error: Error | null}>}
   */
  async batchUpdate(table, updates) {
    try {
      const promises = updates.map((update) =>
        this.update(table, update.data, update.where)
      );
      const results = await Promise.all(promises);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        throw new Error('Some updates failed');
      }

      return { success: true, error: null };
    } catch (error) {
      console.error(`Error batch updating ${table}:`, error);
      return { success: false, error };
    }
  }
}

export const apiClient = new ApiClient();

/**
 * Helper hook for handling API calls with toast notifications
 */
export const useApi = () => {
  return {
    async execute(fn, successMsg, errorMsg) {
      try {
        const result = await fn();
        if (result.error) {
          toast.error(errorMsg || result.error.message);
          return { success: false, error: result.error };
        }
        if (successMsg) toast.success(successMsg);
        return { success: true, data: result.data };
      } catch (error) {
        toast.error(errorMsg || error.message);
        return { success: false, error };
      }
    },
  };
};
