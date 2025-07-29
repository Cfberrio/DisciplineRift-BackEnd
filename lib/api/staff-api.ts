import { supabase } from "@/lib/supabase/client";

export interface Staff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export const staffApi = {
  async getAll(): Promise<Staff[]> {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id, name, email, phone")
        .order("name", { ascending: true });

      if (error) {
        throw new Error(`Error fetching staff: ${error.message}`);
      }

      return (data || []) as Staff[];
    } catch (error) {
      throw error;
    }
  },

  async getById(id: string): Promise<Staff> {
    const { data, error } = await supabase
      .from("staff")
      .select("id, name, email, phone")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching staff:", error);
      throw new Error(`Error fetching staff: ${error.message}`);
    }

    return data;
  },

  async create(staff: Omit<Staff, "id">): Promise<Staff> {
    const { data, error } = await supabase
      .from("staff")
      .insert([staff])
      .select("id, name, email, phone")
      .single();

    if (error) {
      console.error("Error creating staff:", error);
      throw new Error(`Error creating staff: ${error.message}`);
    }

    return data;
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff> {
    const { data, error } = await supabase
      .from("staff")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, phone")
      .single();

    if (error) {
      console.error("Error updating staff:", error);
      throw new Error(`Error updating staff: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("staff").delete().eq("id", id);

    if (error) {
      console.error("Error deleting staff:", error);
      throw new Error(`Error deleting staff: ${error.message}`);
    }
  },
};
