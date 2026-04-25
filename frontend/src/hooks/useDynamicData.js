/**
 * ProHouze Dynamic Data Hooks
 * Version: 1.0 - Prompt 3/20
 * 
 * Hooks for fetching and caching master data and entity schemas from backend API.
 * These hooks provide a clean interface for components to access dynamic configuration.
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// CACHE CONFIGURATION
// ============================================

// In-memory cache for master data
const masterDataCache = new Map();
const entitySchemaCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// MASTER DATA CONTEXT
// ============================================

const MasterDataContext = createContext(null);

/**
 * Provider component for master data context
 * Wraps the app to provide access to all master data
 * Only fetches when user is authenticated to avoid console errors on public pages
 */
export function MasterDataProvider({ children }) {
  const [masterData, setMasterData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Only fetch when authenticated — prevents console errors on public pages
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadAllMasterData();
  }, [isAuthenticated]);


  const loadAllMasterData = async () => {
    try {
      // Check cache first
      const cachedData = masterDataCache.get('all');
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        setMasterData(cachedData.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      // Note: api instance already has /api prefix in baseURL
      const response = await api.get('/config/master-data');
      setMasterData(response.data);
      
      // Update cache
      masterDataCache.set('all', {
        data: response.data,
        timestamp: Date.now()
      });
      
      setLoading(false);
    } catch (err) {
      // Silently fail — master data is optional for CRM features
      setError(err);
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    masterData,
    loading,
    error,
    refresh: loadAllMasterData,
  }), [masterData, loading, error]);

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}


/**
 * Hook to access the master data context
 */
export function useMasterDataContext() {
  const context = useContext(MasterDataContext);
  if (!context) {
    console.warn('useMasterDataContext must be used within MasterDataProvider');
    return { masterData: {}, loading: true, error: null, refresh: () => {} };
  }
  return context;
}

// ============================================
// MASTER DATA HOOKS
// ============================================

/**
 * Hook to get a specific master data category
 * @param {string} categoryKey - The key of the category (e.g., 'lead_statuses')
 * @returns {Object} { items, loading, error, getLabel, getItem, toSelectOptions }
 */
export function useMasterData(categoryKey) {
  const { masterData, loading: contextLoading, error: contextError } = useMasterDataContext();
  
  const category = masterData[categoryKey];
  const items = useMemo(() => category?.items || [], [category]);
  
  const getLabel = useCallback((code, fallback = 'N/A') => {
    const item = items.find(i => i.code === code);
    return item?.label || fallback;
  }, [items]);
  
  const getItem = useCallback((code) => {
    return items.find(i => i.code === code);
  }, [items]);
  
  const getColor = useCallback((code, fallback = 'bg-slate-100 text-slate-700') => {
    const item = items.find(i => i.code === code);
    return item?.color || fallback;
  }, [items]);
  
  const toSelectOptions = useMemo(() => {
    return items.map(item => ({
      value: item.code,
      label: item.label,
    }));
  }, [items]);
  
  const getItemsByGroup = useCallback((group) => {
    return items.filter(item => item.group === group);
  }, [items]);
  
  return {
    items,
    loading: contextLoading,
    error: contextError,
    getLabel,
    getItem,
    getColor,
    toSelectOptions,
    getItemsByGroup,
    category,
  };
}

/**
 * Hook to get select options from master data
 * Simplified version for form selects
 */
export function useSelectOptions(categoryKey) {
  const { toSelectOptions, loading } = useMasterData(categoryKey);
  return { options: toSelectOptions, loading };
}

/**
 * Hook to resolve multiple codes to labels at once
 */
export function useLabelResolver(categoryKey) {
  const { getLabel, getColor, getItem } = useMasterData(categoryKey);
  
  const resolveLabels = useCallback((codes) => {
    if (!Array.isArray(codes)) return {};
    return codes.reduce((acc, code) => {
      acc[code] = getLabel(code);
      return acc;
    }, {});
  }, [getLabel]);
  
  return { getLabel, getColor, getItem, resolveLabels };
}

// ============================================
// ENTITY SCHEMA HOOKS
// ============================================

/**
 * Hook to get entity schema
 * @param {string} entityName - The entity name (e.g., 'lead', 'task')
 */
export function useEntitySchema(entityName) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entityName) return;
    
    const loadSchema = async () => {
      try {
        // Check cache
        const cached = entitySchemaCache.get(entityName);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setSchema(cached.data);
          setLoading(false);
          return;
        }

        const response = await api.get(`/config/entity-schemas/${entityName}`);
        setSchema(response.data);
        
        entitySchemaCache.set(entityName, {
          data: response.data,
          timestamp: Date.now()
        });
        
        setLoading(false);
      } catch (err) {
        console.error(`Failed to load schema for ${entityName}:`, err);
        setError(err);
        setLoading(false);
      }
    };

    loadSchema();
  }, [entityName]);

  return { schema, loading, error };
}

/**
 * Hook to get form configuration for an entity
 */
export function useFormConfig(entityName) {
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entityName) return;
    
    const loadConfig = async () => {
      try {
        const cacheKey = `form_${entityName}`;
        const cached = entitySchemaCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setFormConfig(cached.data);
          setLoading(false);
          return;
        }

        const response = await api.get(`/config/entity-schemas/${entityName}/form-config`);
        setFormConfig(response.data);
        
        entitySchemaCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        
        setLoading(false);
      } catch (err) {
        console.error(`Failed to load form config for ${entityName}:`, err);
        setError(err);
        setLoading(false);
      }
    };

    loadConfig();
  }, [entityName]);

  return { formConfig, loading, error };
}

/**
 * Hook to get list/table configuration for an entity
 */
export function useListConfig(entityName) {
  const [listConfig, setListConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entityName) return;
    
    const loadConfig = async () => {
      try {
        const cacheKey = `list_${entityName}`;
        const cached = entitySchemaCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setListConfig(cached.data);
          setLoading(false);
          return;
        }

        const response = await api.get(`/config/entity-schemas/${entityName}/list-config`);
        setListConfig(response.data);
        
        entitySchemaCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        
        setLoading(false);
      } catch (err) {
        console.error(`Failed to load list config for ${entityName}:`, err);
        setError(err);
        setLoading(false);
      }
    };

    loadConfig();
  }, [entityName]);

  return { listConfig, loading, error };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clear all cached data
 */
export function clearDynamicDataCache() {
  masterDataCache.clear();
  entitySchemaCache.clear();
}

/**
 * Prefetch master data for faster initial load
 */
export async function prefetchMasterData() {
  try {
    const response = await api.get('/config/master-data');
    masterDataCache.set('all', {
      data: response.data,
      timestamp: Date.now()
    });
    return response.data;
  } catch (err) {
    console.error('Failed to prefetch master data:', err);
    return null;
  }
}

export default {
  MasterDataProvider,
  useMasterDataContext,
  useMasterData,
  useSelectOptions,
  useLabelResolver,
  useEntitySchema,
  useFormConfig,
  useListConfig,
  clearDynamicDataCache,
  prefetchMasterData,
};
