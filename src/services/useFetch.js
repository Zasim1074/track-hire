import { useState } from "react";
import { useSession } from "@clerk/clerk-react";
import supabaseClient from "@/utils/supabase";

export const useFetch = (cb, options = {}) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { session, isLoaded } = useSession();

  const fn = async (newOptions = {}) => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      let token = null;

      if (session) {
        token = await session.getToken({ template: "supabase" });
      }

      const supabase = supabaseClient(token);

      const response = await cb(supabase, { ...options, ...newOptions });
      setData(response);
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { fn, data, loading, error };
};
