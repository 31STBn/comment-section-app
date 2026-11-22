import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lpgxaeiyndfsjxgbullf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZ3hhZWl5bmRmc2p4Z2J1bGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MDU5MDcsImV4cCI6MjEwODM4MTkwN30.FJuBQAX8uZP22y40ixkSAOaZEd_QzNt2XEpqGeV5M2A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
