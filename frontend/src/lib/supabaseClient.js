/**
 * supabaseClient.js — E1 (webpackIgnore safe version)
 * Supabase client — lazy loaded để không lỗi khi chưa install package
 * Production: npm install @supabase/supabase-js
 */

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

let _client = null;

const getClient = async () => {
  if (_client) return _client;
  if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) return null;

  try {
    const { createClient } = await import(/* webpackIgnore: true */ '@supabase/supabase-js').catch(() => ({ createClient: null }));
    if (!createClient) return null;

    _client = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        autoRefreshToken:    true,
        persistSession:      true,
        detectSessionInUrl:  true,
        storageKey:          'prohouzing-auth',
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
      global: {
        headers: { 'x-app-version': '2.1.0', 'x-app-name': 'ProHouze' },
      },
    });
    return _client;
  } catch {
    return null;
  }
};

// ─── Storage helpers ───────────────────────────────────────────────────────────
export const storage = {
  upload: async (bucket, path, file) => {
    const sb = await getClient();
    if (!sb) throw new Error('Supabase not configured');
    const { data, error } = await sb.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  },
  remove: async (bucket, paths) => {
    const sb = await getClient();
    if (!sb) return;
    const { error } = await sb.storage.from(bucket).remove(paths);
    if (error) throw error;
  },
};

// ─── Realtime helpers ──────────────────────────────────────────────────────────
export const subscribeToTable = async (table, callback) => {
  const sb = await getClient();
  if (!sb) return () => {};

  const channel = sb.channel(`${table}-changes`).on(
    'postgres_changes',
    { event: '*', schema: 'public', table },
    callback
  );
  channel.subscribe();
  return () => sb.removeChannel(channel);
};

export const subscribeInserts = (table, callback) =>
  subscribeToTable(table, (p) => { if (p.eventType === 'INSERT') callback(p.new); });

export const subscribeUpdates = (table, callback) =>
  subscribeToTable(table, (p) => { if (p.eventType === 'UPDATE') callback(p.new, p.old); });

// ─── DB query helpers ──────────────────────────────────────────────────────────
export const db = {
  findById: async (table, id) => {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  findAll: async (table, filters = {}, options = {}) => {
    const sb = await getClient();
    if (!sb) return [];
    let q = sb.from(table).select(options.select || '*');
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    if (options.order) q = q.order(options.order.column, { ascending: options.order.asc ?? false });
    if (options.limit)  q = q.limit(options.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  insert: async (table, row) => {
    const sb = await getClient();
    if (!sb) throw new Error('Supabase not configured');
    const { data, error } = await sb.from(table).insert(row).select().single();
    if (error) throw error;
    return data;
  },

  update: async (table, id, updates) => {
    const sb = await getClient();
    if (!sb) throw new Error('Supabase not configured');
    const { data, error } = await sb.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  count: async (table, filters = {}) => {
    const sb = await getClient();
    if (!sb) return 0;
    let q = sb.from(table).select('id', { count: 'exact', head: true });
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  },

  rpc: async (fn, params = {}) => {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.rpc(fn, params);
    if (error) throw error;
    return data;
  },
};

// ─── Connection check ──────────────────────────────────────────────────────────
export const checkSupabaseConnection = async () => {
  const sb = await getClient();
  if (!sb) return { connected: false, error: 'Not configured — set REACT_APP_SUPABASE_URL' };
  try {
    await sb.from('lease_contracts').select('id', { count: 'exact', head: true });
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

export default { getClient, db, storage, subscribeToTable, subscribeInserts, subscribeUpdates };
