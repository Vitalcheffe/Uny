
import { supabase } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface DataErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
  }
}

async function handleDataError(error: any, operationType: OperationType, path: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  const errInfo: DataErrorInfo = {
    error: error.message || String(error),
    authInfo: {
      userId: user?.id,
    },
    operationType,
    path
  };
  
  console.error(`🔥 [DataService] Error during ${operationType} on ${path}:`, error);
  throw error;
}

/**
 * Recursively removes undefined values from an object.
 */
function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data === undefined ? null : data;
  }

  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(sanitizeData);
  }

  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined) {
      sanitized[key] = sanitizeData(value);
    }
  });
  return sanitized;
}

export const firestoreService = {
  // Generic collection fetch
  getCollection: async (collectionName: string, orgId: string, filters: { field: string, operator: any, value: any }[] = [], orderField?: string, orderDir: 'asc' | 'desc' = 'asc', limitCount?: number) => {
    try {
      let query = (supabase.from(collectionName as any) as any).select('*');
      
      if (collectionName !== 'organizations') {
        query = query.eq('org_id', orgId);
      } else {
        query = query.eq('id', orgId);
      }
      
      filters.forEach(f => {
        if (f.operator === '==') query = query.eq(f.field, f.value);
        else if (f.operator === '!=') query = query.neq(f.field, f.value);
        else if (f.operator === '>') query = query.gt(f.field, f.value);
        else if (f.operator === '>=') query = query.gte(f.field, f.value);
        else if (f.operator === '<') query = query.lt(f.field, f.value);
        else if (f.operator === '<=') query = query.lte(f.field, f.value);
        else if (f.operator === 'array-contains') query = query.contains(f.field, [f.value]);
        else if (f.operator === 'in') query = query.in(f.field, f.value);
      });
      
      if (orderField) {
        query = query.order(orderField, { ascending: orderDir === 'asc' });
      }
      
      if (limitCount) {
        query = query.limit(limitCount);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      await handleDataError(error, OperationType.LIST, collectionName);
      return [];
    }
  },

  getCollectionGlobal: async (collectionName: string, filters: { field: string, operator: any, value: any }[] = [], orderField?: string, orderDir: 'asc' | 'desc' = 'asc', limitCount?: number) => {
    try {
      let query = (supabase.from(collectionName as any) as any).select('*');
      
      filters.forEach(f => {
        if (f.operator === '==') query = query.eq(f.field, f.value);
        else if (f.operator === '!=') query = query.neq(f.field, f.value);
        else if (f.operator === '>') query = query.gt(f.field, f.value);
        else if (f.operator === '>=') query = query.gte(f.field, f.value);
        else if (f.operator === '<') query = query.lt(f.field, f.value);
        else if (f.operator === '<=') query = query.lte(f.field, f.value);
        else if (f.operator === 'array-contains') query = query.contains(f.field, [f.value]);
        else if (f.operator === 'in') query = query.in(f.field, f.value);
      });
      
      if (orderField) {
        query = query.order(orderField, { ascending: orderDir === 'asc' });
      }
      
      if (limitCount) {
        query = query.limit(limitCount);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      await handleDataError(error, OperationType.LIST, collectionName);
      return [];
    }
  },

  // Real-time listener
  subscribeToCollection: (collectionName: string, orgId: string, filters: { field: string, operator: any, value: any }[], callback: (data: any[]) => void, orderField?: string, orderDir: 'asc' | 'desc' = 'asc') => {
    // Initial fetch
    firestoreService.getCollection(collectionName, orgId, filters, orderField, orderDir).then(callback);

    const filter = collectionName === 'organizations' ? `id=eq.${orgId}` : `org_id=eq.${orgId}`;

    const channel = supabase
      .channel(`${collectionName}-org-${orgId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: collectionName,
        filter: filter
      }, () => {
        firestoreService.getCollection(collectionName, orgId, filters, orderField, orderDir).then(callback);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToCollectionGlobal: (collectionName: string, filters: { field: string, operator: any, value: any }[], callback: (data: any[]) => void, orderField?: string, orderDir: 'asc' | 'desc' = 'asc') => {
    // Initial fetch
    firestoreService.getCollectionGlobal(collectionName, filters, orderField, orderDir).then(callback);

    const channel = supabase
      .channel(`${collectionName}-global`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: collectionName
      }, () => {
        firestoreService.getCollectionGlobal(collectionName, filters, orderField, orderDir).then(callback);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Document operations
  addDocument: async (collectionName: string, orgId: string, data: any) => {
    try {
      const sanitizedData = sanitizeData(data);
      const insertData: any = { ...sanitizedData };
      
      if (collectionName !== 'organizations') {
        insertData.org_id = orgId;
      }

      const { data: inserted, error } = await (supabase
        .from(collectionName as any) as any)
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return inserted?.id;
    } catch (error) {
      await handleDataError(error, OperationType.CREATE, collectionName);
    }
  },

  addDocumentGlobal: async (collectionName: string, data: any) => {
    try {
      const sanitizedData = sanitizeData(data);
      const { data: inserted, error } = await (supabase
        .from(collectionName as any) as any)
        .insert(sanitizedData)
        .select()
        .single();
      
      if (error) throw error;
      return inserted?.id;
    } catch (error) {
      await handleDataError(error, OperationType.CREATE, collectionName);
    }
  },

  updateDocument: async (collectionName: string, orgId: string, docId: string, data: any) => {
    try {
      const sanitizedData = sanitizeData(data);
      let query = (supabase.from(collectionName as any) as any).update(sanitizedData).eq('id', docId);
      
      if (collectionName !== 'organizations') {
        query = query.eq('org_id', orgId);
      }

      const { error } = await query;
      
      if (error) throw error;
    } catch (error) {
      await handleDataError(error, OperationType.UPDATE, `${collectionName}/${docId}`);
    }
  },

  updateDocumentGlobal: async (collectionName: string, docId: string, data: any) => {
    try {
      const sanitizedData = sanitizeData(data);
      const { error } = await (supabase
        .from(collectionName as any) as any)
        .update(sanitizedData)
        .eq('id', docId);
      
      if (error) throw error;
    } catch (error) {
      await handleDataError(error, OperationType.UPDATE, `${collectionName}/${docId}`);
    }
  },

  deleteDocument: async (collectionName: string, orgId: string, docId: string) => {
    try {
      let query = (supabase.from(collectionName as any) as any).update({ deleted_at: new Date().toISOString() }).eq('id', docId);
      
      if (collectionName !== 'organizations') {
        query = query.eq('org_id', orgId);
      }

      const { error } = await query;
      
      if (error) throw error;
    } catch (error) {
      await handleDataError(error, OperationType.DELETE, `${collectionName}/${docId}`);
    }
  },

  setDocument: async (collectionName: string, orgId: string, docId: string, data: any) => {
    try {
      const sanitizedData = sanitizeData(data);
      const upsertData: any = {
        id: docId,
        ...sanitizedData
      };
      
      // Don't add org_id if we're writing to the organizations table itself
      if (collectionName !== 'organizations') {
        upsertData.org_id = orgId;
      }
      
      const { error } = await (supabase
        .from(collectionName as any) as any)
        .upsert(upsertData);
      
      if (error) throw error;
    } catch (error) {
      await handleDataError(error, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  },

  setDocumentGlobal: async (collectionName: string, docId: string, data: any) => {
    try {
      const sanitizedData = sanitizeData(data);
      const { error } = await (supabase
        .from(collectionName as any) as any)
        .upsert({
          id: docId,
          ...sanitizedData
        });
      
      if (error) throw error;
    } catch (error) {
      await handleDataError(error, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  },

  getDocument: async (collectionName: string, orgId: string, docId: string) => {
    try {
      let query = (supabase.from(collectionName as any) as any).select('*').eq('id', docId);
      
      if (collectionName !== 'organizations') {
        query = query.eq('org_id', orgId);
      }

      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      await handleDataError(error, OperationType.GET, `${collectionName}/${docId}`);
      return null;
    }
  },

  getCountGlobal: async (collectionName: string, filters: { field: string, operator: any, value: any }[] = []) => {
    try {
      let query = (supabase.from(collectionName as any) as any).select('*', { count: 'exact', head: true });
      filters.forEach(f => {
        if (f.operator === '==') query = query.eq(f.field, f.value);
      });
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      await handleDataError(error, OperationType.LIST, collectionName);
      return 0;
    }
  }
};

