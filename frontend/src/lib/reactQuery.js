/**
 * reactQuery.js — Lightweight shim thay thế @tanstack/react-query
 * Dùng useState + useEffect + useCallback pattern
 * Compatible API: useQuery, useMutation, useQueryClient
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Simple in-memory cache ────────────────────────────────────────────────────
const cache = new Map();
const subscribers = new Map();

const notify = (key) => {
  const subs = subscribers.get(key) || [];
  subs.forEach(fn => fn());
};

const setCache = (key, data, staleTime = 60000) => {
  cache.set(key, { data, timestamp: Date.now(), staleTime });
  notify(key);
};

const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.staleTime) return null; // stale
  return entry.data;
};

// ─── useQueryClient shim ──────────────────────────────────────────────────────
export const useQueryClient = () => ({
  invalidateQueries: ({ queryKey }) => {
    const keyStr = JSON.stringify(queryKey);
    cache.forEach((_, k) => {
      if (k.startsWith(keyStr.slice(0, -1))) {
        cache.delete(k);
        notify(k);
      }
    });
    // Also invalidate prefix matches
    cache.delete(keyStr);
    notify(keyStr);
  },
  setQueryData: (queryKey, data) => {
    const keyStr = JSON.stringify(queryKey);
    setCache(keyStr, data);
  },
  getQueryData: (queryKey) => getCache(JSON.stringify(queryKey)),
});

// ─── useQuery shim ────────────────────────────────────────────────────────────
export const useQuery = ({ queryKey, queryFn, enabled = true, staleTime = 60000, refetchInterval = null, select, retry = 1, onError }) => {
  const keyStr = JSON.stringify(queryKey);
  const [state, setState] = useState({ data: null, isLoading: true, error: null });
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const cached = getCache(keyStr);
    if (cached !== null) {
      const processed = select ? select(cached) : cached;
      if (mountedRef.current) setState({ data: processed, isLoading: false, error: null });
      return;
    }

    if (mountedRef.current) setState(prev => ({ ...prev, isLoading: true }));
    let attempts = 0;
    while (attempts <= retry) {
      try {
        const raw = await queryFn();
        setCache(keyStr, raw, staleTime);
        const processed = select ? select(raw) : raw;
        if (mountedRef.current) setState({ data: processed, isLoading: false, error: null });
        return;
      } catch (err) {
        attempts++;
        if (attempts > retry) {
          onError?.(err);
          if (mountedRef.current) setState({ data: null, isLoading: false, error: err });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr, enabled, staleTime, retry]);

  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to cache updates
    if (!subscribers.has(keyStr)) subscribers.set(keyStr, []);
    const sub = () => { if (mountedRef.current) fetchData(); };
    subscribers.get(keyStr).push(sub);

    fetchData();

    // RefetchInterval
    if (refetchInterval) {
      intervalRef.current = setInterval(() => {
        cache.delete(keyStr); // force fresh
        fetchData();
      }, refetchInterval);
    }

    return () => {
      mountedRef.current = false;
      const subs = subscribers.get(keyStr) || [];
      subscribers.set(keyStr, subs.filter(s => s !== sub));
      clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr, enabled, refetchInterval]);

  return { ...state, refetch: () => { cache.delete(keyStr); fetchData(); } };
};

// ─── useMutation shim ─────────────────────────────────────────────────────────
export const useMutation = ({ mutationFn, onSuccess, onError, onMutate }) => {
  const [state, setState] = useState({ data: null, isLoading: false, error: null, isSuccess: false });

  const mutate = useCallback(async (variables) => {
    setState({ data: null, isLoading: true, error: null, isSuccess: false });
    onMutate?.(variables);
    try {
      const data = await mutationFn(variables);
      setState({ data, isLoading: false, error: null, isSuccess: true });
      onSuccess?.(data, variables);
      return data;
    } catch (err) {
      setState({ data: null, isLoading: false, error: err, isSuccess: false });
      onError?.(err, variables);
      throw err;
    }
  }, [mutationFn, onSuccess, onError, onMutate]);

  const mutateAsync = mutate;

  return { ...state, mutate, mutateAsync };
};
