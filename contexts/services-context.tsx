"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";

interface Service {
  id: string;
  teamid: string;
  name: string;
  description: string;
  price: number;
  participants: number;
  status: "active" | "inactive" | "ended";
  isactive: boolean;
  schoolid: number;
  school?: string;
  sessions?: any[];
  enrolledStudents?: number;
  sport?: "Volleyball" | "Tennis" | "Pickleball";
  isongoing?: boolean;
}

interface ServicesContextType {
  services: Service[];
  isLoading: boolean;
  error: Error | null;
  createService: (service: any) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(
  undefined
);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = useCallback(async (retryCount = 0) => {
    const maxRetries = 2;
    const baseTimeout = 45000; // 45 seconds base timeout for complex query
    const timeoutMultiplier = retryCount + 1;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log("ServicesContext: Fetching services...", retryCount > 0 ? `(retry ${retryCount})` : "");

      // Progressive timeout increase with retries
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), baseTimeout * timeoutMultiplier);
      });

      const teamsPromise = supabase.from("team").select(`
          teamid,
          schoolid,
          name,
          description,
          price,
          participants,
          isactive,
          sport,
          isongoing,
          created_at,
          updated_at,
          school:schoolid (
            name,
            location
          )
        `);

      const { data: teams, error: teamsError } = (await Promise.race([
        teamsPromise,
        timeoutPromise,
      ])) as any;

      if (teamsError) {
        console.error("ServicesContext: Error fetching teams:", teamsError);
        throw teamsError;
      }

      // Ensure teams is always an array
      const teamsArray = Array.isArray(teams) ? teams : [];

      if (teamsArray.length === 0) {
        setServices([]);
        return;
      }

      // Optimize: Get all enrollments and sessions in batch queries
      const teamIds = teamsArray.map((team) => team.teamid);

      // Batch query for all enrollments
      const { data: allEnrollments } = await supabase
        .from("enrollment")
        .select("teamid")
        .in("teamid", teamIds)
        .eq("isactive", true);

      // Batch query for all sessions
      const { data: allSessions } = await supabase
        .from("session")
        .select("*")
        .in("teamid", teamIds);

      // Group data by teamid for efficient lookup
      const enrollmentCounts = (allEnrollments || []).reduce(
        (acc, enrollment: any) => {
          const teamId = String(enrollment.teamid);
          acc[teamId] = (acc[teamId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const sessionsByTeam = (allSessions || []).reduce((acc: Record<string, any[]>, session: any) => {
        const teamId = String(session.teamid);
        if (!acc[teamId]) acc[teamId] = [];
        acc[teamId].push(session);
        return acc;
      }, {} as Record<string, any[]>);

      // Process teams with pre-fetched data
      const servicesWithDetails = teamsArray.map((team: any) => {
        try {
          const teamId = String(team.teamid);
          const enrolledCount = enrollmentCounts[teamId] || 0;
          const teamSessions = sessionsByTeam[teamId] || ([] as any[]);

          return {
            id: team.teamid,
            teamid: team.teamid,
            name: team.name || "Sin nombre",
            description: team.description || "",
            price: team.price || 0,
            participants: team.participants || 0,
            status: team.isactive
              ? "active"
              : ("inactive" as "active" | "inactive" | "ended"),
            isactive: team.isactive,
            schoolid: team.schoolid,
            school: team.school?.name || "Sin escuela",
            sessions: teamSessions,
            enrolledStudents: enrolledCount,
            sport: team.sport,
            isongoing: team.isongoing || false,
          };
        } catch (error) {
          console.error(
            "ServicesContext: Error processing team:",
            team.teamid,
            error
          );
          return {
            id: team.teamid,
            teamid: team.teamid,
            name: team.name || "Sin nombre",
            description: team.description || "",
            price: team.price || 0,
            participants: 0,
            status: "inactive" as "active" | "inactive" | "ended",
            isactive: team.isactive,
            schoolid: team.schoolid,
            school: team.school?.name || "Sin escuela",
            sessions: [],
            enrolledStudents: 0,
            sport: team.sport,
            isongoing: team.isongoing || false,
          };
        }
      });

      console.log(
        "ServicesContext: Services with details:",
        servicesWithDetails
      );
      setServices(servicesWithDetails);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      console.error("ServicesContext: Error fetching services:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      
      // Retry logic for timeout and network errors - NO usar setTimeout para evitar loops
      if (retryCount < maxRetries && (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("fetch"))) {
        console.log(`ServicesContext: Retry ${retryCount + 1}/${maxRetries} failed, but not scheduling automatic retry to prevent loops`);
      }
      
      setError(err as Error);
      setServices([]); // Always set to empty array on final error
    } finally {
      // Only set loading false if this is the final attempt or success
      if (retryCount >= maxRetries || !error) {
        setIsLoading(false);
      }
    }
  }, []); // No dependencies to prevent loops

  const createService = async (serviceData: any) => {
    try {
      console.log("ServicesContext: Creating service with data:", serviceData);

      // Step 1: Create the team record first
      const teamInsertData = {
        name: serviceData.name,
        description: serviceData.description,
        schoolid: serviceData.schoolId,
        price: serviceData.price,
        participants: serviceData.participants || 20,
        isactive: serviceData.status === "active",
        sport: serviceData.sport,
        isongoing: serviceData.isongoing || false,
      };

      console.log("ServicesContext: Creating team with data:", teamInsertData);

      const { data: newTeam, error: teamError } = await supabase
        .from("team")
        .insert([teamInsertData])
        .select()
        .single();

      if (teamError) {
        console.error("ServicesContext: Error creating team:", teamError);
        throw new Error(`Failed to create team: ${teamError.message}`);
      }

      console.log(
        "ServicesContext: Team created successfully with teamid:",
        newTeam.teamid
      );

      // Step 2: Create sessions using the returned teamid
      if (
        serviceData.sections &&
        Array.isArray(serviceData.sections) &&
        serviceData.sections.length > 0
      ) {
        console.log(
          "ServicesContext: Creating sessions for sections:",
          serviceData.sections
        );

        for (const section of serviceData.sections) {
          console.log("ServicesContext: Processing section:", section);

          // Validate section data
          if (!section.startDate || !section.startTime) {
            console.warn(
              "ServicesContext: Skipping section with missing startDate or startTime:",
              section
            );
            continue;
          }

          // Convert startDate to Date object if it's not already
          const startDate =
            section.startDate instanceof Date
              ? section.startDate
              : new Date(section.startDate);

          // Get the day of the week from the start date
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          let dayOfWeek = dayNames[startDate.getDay()];

          // If section has daysOfWeek array, use the first one (or could combine them)
          if (
            section.daysOfWeek &&
            Array.isArray(section.daysOfWeek) &&
            section.daysOfWeek.length > 0
          ) {
            dayOfWeek = section.daysOfWeek[0]; // Use first selected day
          }

          // Calculate end time based on start time and duration
          const [startHour, startMinute] = section.startTime
            .split(":")
            .map(Number);

          // Parse duration (handles "1 hr", "30 min", "1.5 hrs", etc.)
          let durationMinutes = 60; // Default
          if (section.duration) {
            const durationStr = section.duration.toLowerCase();
            if (durationStr.includes("min")) {
              durationMinutes = parseInt(durationStr) || 60;
            } else if (durationStr.includes("hr")) {
              const hours = parseFloat(durationStr) || 1;
              durationMinutes = hours * 60;
            }
          }

          const endTime = new Date(
            0,
            0,
            0,
            startHour,
            startMinute + durationMinutes
          );
          const endTimeString = endTime.toTimeString().slice(0, 5);

          // Use end date from section if available, otherwise calculate based on repeat pattern
          let endDate = startDate;
          if (section.endDate) {
            // Use the end date from the form - ensure proper date handling
            if (section.endDate instanceof Date) {
              endDate = section.endDate;
            } else {
              // If it's a string, parse it properly
              const endDateStr = section.endDate;
              if (typeof endDateStr === "string") {
                // Handle different date formats
                if (endDateStr.includes("T")) {
                  endDate = new Date(endDateStr);
                } else {
                  // Assume YYYY-MM-DD format
                  const [year, month, day] = endDateStr.split("-").map(Number);
                  endDate = new Date(year, month - 1, day); // month is 0-indexed
                }
              } else {
                endDate = new Date(endDateStr);
              }
            }
          } else if (
            section.recurringDates &&
            Array.isArray(section.recurringDates) &&
            section.recurringDates.length > 0
          ) {
            // Use last recurring date
            endDate = section.recurringDates[section.recurringDates.length - 1];
          } else if (section.repeat && section.repeat !== "none") {
            // Calculate end date based on repeat pattern (default to 8 weeks)
            const weeksToAdd =
              section.repeat === "weekly"
                ? 8
                : section.repeat === "biweekly"
                ? 16
                : 32;
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + weeksToAdd * 7);
          }

          // Prepare session data
          const sessionData = {
            teamid: newTeam.teamid,
            startdate: startDate.toISOString().split("T")[0],
            enddate: endDate.toISOString().split("T")[0],
            starttime: section.startTime,
            endtime: section.endTime || endTimeString, // Use endTime if available, otherwise calculate
            repeat: section.repeat || "none",
            daysofweek: dayOfWeek,
            coachid: section.staffId || null, // staffId is UUID string, use directly
          };

          console.log("ServicesContext: Creating session:", sessionData);
          console.log(
            "ServicesContext: Original section.endDate:",
            section.endDate
          );
          console.log("ServicesContext: Processed endDate object:", endDate);
          console.log(
            "ServicesContext: Final enddate string:",
            endDate.toISOString().split("T")[0]
          );

          const { error: sessionError } = await supabase
            .from("session")
            .insert([sessionData]);

          if (sessionError) {
            console.error(
              "ServicesContext: Error creating session:",
              sessionError
            );
            throw new Error(
              `Failed to create session: ${sessionError.message}`
            );
          }
        }

        console.log("ServicesContext: All sessions created successfully");
      }

      // NO refrescar automáticamente para evitar loops - el estado local se actualiza en tiempo real
      console.log("ServicesContext: Service creation completed successfully");
    } catch (error) {
      console.error("ServicesContext: Error creating service:", error);
      throw error;
    }
  };

  const updateService = async (id: string, serviceData: any) => {
    try {
      console.log("ServicesContext: Updating service:", id, serviceData);

      const updateData: any = {};
      if (serviceData.name !== undefined) updateData.name = serviceData.name;
      if (serviceData.description !== undefined)
        updateData.description = serviceData.description;
      if (serviceData.price !== undefined) updateData.price = serviceData.price;
      if (serviceData.schoolid !== undefined)
        updateData.schoolid = serviceData.schoolid;
      if (serviceData.participants !== undefined)
        updateData.participants = serviceData.participants;
      if (serviceData.isactive !== undefined)
        updateData.isactive = serviceData.isactive;
      if (serviceData.sport !== undefined)
        updateData.sport = serviceData.sport;
      if (serviceData.isongoing !== undefined)
        updateData.isongoing = serviceData.isongoing;

      const { error } = await supabase
        .from("team")
        .update(updateData)
        .eq("teamid", id);

      if (error) {
        console.error("ServicesContext: Error updating team:", error);
        throw error;
      }

      // Update sessions if provided
      if (serviceData.sections && Array.isArray(serviceData.sections)) {
        console.log("ServicesContext: Updating sessions for service:", id);
        
        // Delete all existing sessions for this team
        const { error: deleteError } = await supabase
          .from("session")
          .delete()
          .eq("teamid", id);

        if (deleteError) {
          console.error("ServicesContext: Error deleting old sessions:", deleteError);
          // Continue anyway to try to create new sessions
        }

        // Create new sessions
        for (const section of serviceData.sections) {
          const startDate =
            section.startDate instanceof Date
              ? section.startDate
              : new Date(section.startDate);

          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          let dayOfWeek = dayNames[startDate.getDay()];

          if (
            section.daysOfWeek &&
            Array.isArray(section.daysOfWeek) &&
            section.daysOfWeek.length > 0
          ) {
            dayOfWeek = section.daysOfWeek[0];
          }

          let endDate = startDate;
          if (section.endDate) {
            endDate = section.endDate instanceof Date
              ? section.endDate
              : new Date(section.endDate);
          }

          const sessionData = {
            teamid: id,
            startdate: startDate.toISOString().split("T")[0],
            enddate: endDate.toISOString().split("T")[0],
            starttime: section.startTime,
            endtime: section.endTime,
            repeat: section.repeat || "none",
            daysofweek: dayOfWeek,
            coachid: section.staffId || null,
          };

          console.log("ServicesContext: Creating updated session:", sessionData);

          const { error: sessionError } = await supabase
            .from("session")
            .insert([sessionData]);

          if (sessionError) {
            console.error("ServicesContext: Error creating session:", sessionError);
            throw new Error(`Failed to create session: ${sessionError.message}`);
          }
        }

        console.log("ServicesContext: All sessions updated successfully");
      }

      // NO refrescar automáticamente para evitar loops - el estado local se actualiza en tiempo real
    } catch (error) {
      console.error("ServicesContext: Error updating service:", error);
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    try {
      console.log("ServicesContext: Deleting service:", id);

      // First delete related sessions
      const { error: sessionsError } = await supabase
        .from("session")
        .delete()
        .eq("teamid", id);

      if (sessionsError) {
        console.error(
          "ServicesContext: Error deleting sessions:",
          sessionsError
        );
        // Continue with team deletion even if sessions deletion fails
      } else {
        console.log(
          "ServicesContext: Sessions deleted successfully for team:",
          id
        );
      }

      // Then delete the team
      const { error: teamError } = await supabase
        .from("team")
        .delete()
        .eq("teamid", id);

      if (teamError) {
        console.error("ServicesContext: Error deleting team:", teamError);
        throw new Error(
          `Error eliminando el servicio: ${
            teamError.message || "Error desconocido"
          }`
        );
      }

      console.log("ServicesContext: Team deleted successfully:", id);

      // Update the local state immediately to provide instant feedback
      setServices((prevServices) => {
        const updatedServices = prevServices.filter(
          (service) => service.id !== id && service.teamid !== id
        );
        console.log(
          "ServicesContext: Updated local state, remaining services:",
          updatedServices.length
        );
        return updatedServices;
      });

      // NO refrescar automáticamente para evitar loops - el estado local se actualiza en tiempo real
      console.log("ServicesContext: Delete completed successfully");
    } catch (error) {
      console.error("ServicesContext: Error deleting service:", error);
      throw error;
    }
  };

  const refreshServices = useCallback(async () => {
    await fetchServices();
  }, [fetchServices]);

  const refreshData = useCallback(async () => {
    await fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    fetchServices();
  }, []); // Sin dependencias para prevenir loops infinitos

  return (
    <ServicesContext.Provider
      value={{
        services,
        isLoading,
        error,
        createService,
        updateService,
        deleteService,
        refreshServices,
        refreshData,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
}
