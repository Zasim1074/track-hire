import { useCallback, useEffect, useRef, useState } from "react";

const EMPTY_OPTIONS = {};

export const useFetch = (cb, options = EMPTY_OPTIONS) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const callbackRef = useRef(cb);
  const optionsRef = useRef(options);
  callbackRef.current = cb;
  optionsRef.current = options;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fn = useCallback(async (newOptions = {}) => {
    const requestId = ++requestIdRef.current;
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await callbackRef.current({
        ...optionsRef.current,
        ...newOptions,
      });
      if (mountedRef.current && requestId === requestIdRef.current) setData(response);
      return response;
    } catch (err) {
      if (mountedRef.current && requestId === requestIdRef.current) setError(err);
      throw err;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  return { fn, data, loading, error };
};
