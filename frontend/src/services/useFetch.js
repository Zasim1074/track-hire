import { useCallback, useRef, useState } from "react";

const EMPTY_OPTIONS = {};

export const useFetch = (cb, options = EMPTY_OPTIONS) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callbackRef = useRef(cb);
  const optionsRef = useRef(options);
  callbackRef.current = cb;
  optionsRef.current = options;

  const fn = useCallback(async (newOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await callbackRef.current({ ...optionsRef.current, ...newOptions });
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fn, data, loading, error };
};
