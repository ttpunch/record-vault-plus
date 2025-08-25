import type { Database } from "@/integrations/supabase/types";

export type Record = Database['public']['Tables']['records']['Row'] & {
  created_by?: string;
  categories: { name: string } | null;
};