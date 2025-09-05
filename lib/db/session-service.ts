import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface Session {
  sessionid: string;
  teamid: string;
  startdate: string;
  enddate: string;
  starttime: string;
  endtime: string;
  daysofweek: string;
  repeat: string;
  coachid: string | null;
  cancel?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSessionData {
  teamid: string;
  startdate: string;
  enddate: string;
  starttime: string;
  endtime: string;
  daysofweek: string;
  repeat: string;
  coachid: string | null;
}

export interface UpdateSessionData {
  teamid?: string;
  startdate?: string;
  enddate?: string;
  starttime?: string;
  endtime?: string;
  daysofweek?: string;
  repeat?: string;
  coachid?: string | null;
  cancel?: string | null;
}

class SessionService {
  // These are the functions called by the API
  async getAll(): Promise<Session[]> {
    return this.getAllServer();
  }

  async getByTeamId(teamid: string): Promise<Session[]> {
    return this.getByTeamIdServer(teamid);
  }

  async getAllServer(): Promise<Session[]> {
    try {
      console.log("[SERVER] SessionService - Fetching all sessions");
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from("session")
        .select("*")
        .order("sessionid", { ascending: true });

      if (error) {
        console.error(
          "[SERVER] SessionService - Supabase error fetching sessions:",
          error.message
        );
        throw new Error(`Error fetching sessions: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionService - Sessions fetched successfully:",
        data?.length || 0
      );
      return data || [];
    } catch (error) {
      console.error("[SERVER] SessionService - Error in getAllServer:", error);
      throw error;
    }
  }

  async getByTeamIdServer(teamid: string): Promise<Session[]> {
    try {
      console.log(
        "[SERVER] SessionService - Fetching sessions for team:",
        teamid
      );
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from("session")
        .select("*")
        .eq("teamid", teamid)
        .order("sessionid", { ascending: true });

      if (error) {
        console.error(
          "[SERVER] SessionService - Supabase error fetching sessions by team:",
          error.message
        );
        throw new Error(`Error fetching sessions by team: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionService - Sessions fetched successfully for team:",
        data?.length || 0
      );
      return data || [];
    } catch (error) {
      console.error(
        "[SERVER] SessionService - Error in getByTeamIdServer:",
        error
      );
      throw error;
    }
  }

  async getByIdServer(sessionid: string): Promise<Session | null> {
    try {
      console.log(
        "[SERVER] SessionService - Fetching session by ID:",
        sessionid
      );
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from("session")
        .select("*")
        .eq("sessionid", sessionid)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            "[SERVER] SessionService - Session not found:",
            sessionid
          );
          return null;
        }
        console.error(
          "[SERVER] SessionService - Supabase error fetching session:",
          error.message
        );
        throw new Error(`Error fetching session: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionService - Session fetched successfully:",
        data?.sessionid
      );
      return data;
    } catch (error) {
      console.error("[SERVER] SessionService - Error in getByIdServer:", error);
      throw error;
    }
  }

  async create(sessionData: CreateSessionData): Promise<Session> {
    try {
      console.log(
        "[SERVER] SessionService - Creating session with data:",
        JSON.stringify(sessionData, null, 2)
      );

      // Validate required fields
      if (!sessionData.teamid) {
        throw new Error("Team ID is required for session creation");
      }

      if (!sessionData.startdate || !sessionData.enddate) {
        throw new Error(
          "Start date and end date are required for session creation"
        );
      }

      const supabase = createServerSupabaseClient();

      // Prepare the data for insertion
      const insertData = {
        teamid: sessionData.teamid,
        startdate: sessionData.startdate,
        enddate: sessionData.enddate,
        starttime: sessionData.starttime || "09:00",
        endtime: sessionData.endtime || "10:00",
        daysofweek: sessionData.daysofweek || "monday",
        repeat: sessionData.repeat || "weekly",
        coachid: sessionData.coachid || null,
      };

      console.log(
        "[SERVER] SessionService - Prepared insert data:",
        JSON.stringify(insertData, null, 2)
      );

      const { data, error } = await supabase
        .from("session")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error(
          "[SERVER] SessionService - Supabase error creating session:",
          error
        );
        throw new Error(`Error creating session: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned from session creation");
      }

      console.log(
        "[SERVER] SessionService - Session created successfully:",
        JSON.stringify(data, null, 2)
      );
      return data;
    } catch (error) {
      console.error("[SERVER] SessionService - Error in create:", error);
      throw error;
    }
  }

  async update(
    sessionid: string,
    sessionData: UpdateSessionData
  ): Promise<Session> {
    try {
      console.log(
        "[SERVER] SessionService - Updating session:",
        sessionid,
        JSON.stringify(sessionData)
      );
      const supabase = createServerSupabaseClient();

      const updateData: any = {};
      if (sessionData.teamid !== undefined)
        updateData.teamid = sessionData.teamid;
      if (sessionData.startdate !== undefined)
        updateData.startdate = sessionData.startdate;
      if (sessionData.enddate !== undefined)
        updateData.enddate = sessionData.enddate;
      if (sessionData.starttime !== undefined)
        updateData.starttime = sessionData.starttime;
      if (sessionData.endtime !== undefined)
        updateData.endtime = sessionData.endtime;
      if (sessionData.daysofweek !== undefined)
        updateData.daysofweek = sessionData.daysofweek;
      if (sessionData.repeat !== undefined)
        updateData.repeat = sessionData.repeat;
      if (sessionData.coachid !== undefined)
        updateData.coachid = sessionData.coachid;
      if (sessionData.cancel !== undefined)
        updateData.cancel = sessionData.cancel;

      console.log(
        "[SERVER] SessionService - Prepared update data:",
        JSON.stringify(updateData)
      );

      const { data, error } = await supabase
        .from("session")
        .update(updateData)
        .eq("sessionid", sessionid)
        .select()
        .single();

      if (error) {
        console.error(
          "[SERVER] SessionService - Supabase error updating session:",
          error
        );
        throw new Error(`Error updating session: ${error.message}`);
      }

      if (!data) {
        throw new Error("Session not found or no data returned");
      }

      console.log(
        "[SERVER] SessionService - Session updated successfully:",
        JSON.stringify(data)
      );
      return data;
    } catch (error) {
      console.error("[SERVER] SessionService - Error in update:", error);
      throw error;
    }
  }

  async delete(sessionid: string): Promise<void> {
    try {
      console.log("[SERVER] SessionService - Deleting session:", sessionid);
      const supabase = createServerSupabaseClient();

      const { error } = await supabase
        .from("session")
        .delete()
        .eq("sessionid", sessionid);

      if (error) {
        console.error(
          "[SERVER] SessionService - Supabase error deleting session:",
          error
        );
        throw new Error(`Error deleting session: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionService - Session deleted successfully:",
        sessionid
      );
    } catch (error) {
      console.error("[SERVER] SessionService - Error in delete:", error);
      throw error;
    }
  }

  async deleteByTeamId(teamid: string): Promise<void> {
    try {
      console.log(
        "[SERVER] SessionService - Deleting all sessions for team:",
        teamid
      );
      const supabase = createServerSupabaseClient();

      const { error } = await supabase
        .from("session")
        .delete()
        .eq("teamid", teamid);

      if (error) {
        console.error(
          "[SERVER] SessionService - Supabase error deleting sessions for team:",
          error
        );
        throw new Error(`Error deleting sessions for team: ${error.message}`);
      }

      console.log(
        "[SERVER] SessionService - All sessions deleted successfully for team:",
        teamid
      );
    } catch (error) {
      console.error(
        "[SERVER] SessionService - Error in deleteByTeamId:",
        error
      );
      throw error;
    }
  }

  async cancelDate(sessionid: string, dateToCancel: string): Promise<Session> {
    try {
      console.log(
        "[SERVER] SessionService - Canceling date for session:",
        { sessionid, dateToCancel }
      );
      
      // First get the current session
      const session = await this.getByIdServer(sessionid);
      if (!session) {
        throw new Error("Session not found");
      }

      // Parse existing canceled dates
      const existingCanceled = session.cancel ? session.cancel.split(',').map(d => d.trim()) : [];
      
      // Add new canceled date if not already present
      if (!existingCanceled.includes(dateToCancel)) {
        existingCanceled.push(dateToCancel);
      }

      // Update the session with new canceled dates
      const updatedCancelString = existingCanceled.join(',');
      
      return await this.update(sessionid, { cancel: updatedCancelString });
    } catch (error) {
      console.error("[SERVER] SessionService - Error in cancelDate:", error);
      throw error;
    }
  }

  async restoreDate(sessionid: string, dateToRestore: string): Promise<Session> {
    try {
      console.log(
        "[SERVER] SessionService - Restoring date for session:",
        { sessionid, dateToRestore }
      );
      
      // First get the current session
      const session = await this.getByIdServer(sessionid);
      if (!session) {
        throw new Error("Session not found");
      }

      // Parse existing canceled dates
      const existingCanceled = session.cancel ? session.cancel.split(',').map(d => d.trim()) : [];
      
      // Remove the date to restore
      const updatedCanceled = existingCanceled.filter(date => date !== dateToRestore);
      
      // Update the session with new canceled dates (empty string if no cancellations)
      const updatedCancelString = updatedCanceled.length > 0 ? updatedCanceled.join(',') : null;
      
      return await this.update(sessionid, { cancel: updatedCancelString });
    } catch (error) {
      console.error("[SERVER] SessionService - Error in restoreDate:", error);
      throw error;
    }
  }
}

export const sessionServer = new SessionService();
