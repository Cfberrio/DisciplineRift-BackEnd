import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface SessionExclusion {
  id?: string;
  sessionid: string;
  excluded_date: string; // YYYY-MM-DD format
  created_at?: string;
}

export interface CreateSessionExclusionData {
  sessionid: string;
  excluded_date: string;
}

class SessionExclusionsService {
  async create(exclusionData: CreateSessionExclusionData): Promise<SessionExclusion> {
    try {
      console.log(
        "[SERVER] SessionExclusionsService - Creating exclusion:",
        exclusionData
      );
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from("session_exclusions")
        .insert([exclusionData])
        .select()
        .single();

      if (error) {
        console.error(
          "[SERVER] SessionExclusionsService - Supabase error creating exclusion:",
          error.message
        );
        throw new Error(`Error creating session exclusion: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned from session exclusion creation");
      }

      console.log(
        "[SERVER] SessionExclusionsService - Exclusion created successfully:",
        data.id
      );
      return data;
    } catch (error) {
      console.error("[SERVER] SessionExclusionsService - Error in create:", error);
      throw error;
    }
  }

  async getBySessionId(sessionid: string): Promise<SessionExclusion[]> {
    try {
      console.log(
        "[SERVER] SessionExclusionsService - Fetching exclusions for session:",
        sessionid
      );
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from("session_exclusions")
        .select("*")
        .eq("sessionid", sessionid);

      if (error) {
        console.error(
          "[SERVER] SessionExclusionsService - Supabase error fetching exclusions:",
          error.message
        );
        throw new Error(`Error fetching session exclusions: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionExclusionsService - Exclusions fetched successfully:",
        data?.length || 0
      );
      return data || [];
    } catch (error) {
      console.error("[SERVER] SessionExclusionsService - Error in getBySessionId:", error);
      throw error;
    }
  }

  async deleteBySessionAndDate(sessionid: string, excluded_date: string): Promise<void> {
    try {
      console.log(
        "[SERVER] SessionExclusionsService - Deleting exclusion:",
        { sessionid, excluded_date }
      );
      const supabase = createServerSupabaseClient();

      const { error } = await supabase
        .from("session_exclusions")
        .delete()
        .eq("sessionid", sessionid)
        .eq("excluded_date", excluded_date);

      if (error) {
        console.error(
          "[SERVER] SessionExclusionsService - Supabase error deleting exclusion:",
          error.message
        );
        throw new Error(`Error deleting session exclusion: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionExclusionsService - Exclusion deleted successfully"
      );
    } catch (error) {
      console.error("[SERVER] SessionExclusionsService - Error in deleteBySessionAndDate:", error);
      throw error;
    }
  }

  async deleteBySessionId(sessionid: string): Promise<void> {
    try {
      console.log(
        "[SERVER] SessionExclusionsService - Deleting all exclusions for session:",
        sessionid
      );
      const supabase = createServerSupabaseClient();

      const { error } = await supabase
        .from("session_exclusions")
        .delete()
        .eq("sessionid", sessionid);

      if (error) {
        console.error(
          "[SERVER] SessionExclusionsService - Supabase error deleting exclusions:",
          error.message
        );
        throw new Error(`Error deleting session exclusions: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionExclusionsService - All exclusions deleted successfully for session:",
        sessionid
      );
    } catch (error) {
      console.error("[SERVER] SessionExclusionsService - Error in deleteBySessionId:", error);
      throw error;
    }
  }
}

export const sessionExclusionsServer = new SessionExclusionsService();

