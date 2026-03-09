import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabaseClient = (token) => {
  if (!token) {
    return createClient(supabaseUrl, supabaseKey);
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: { 
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export default supabaseClient;
