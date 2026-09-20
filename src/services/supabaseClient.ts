/**
 * ResQZone Supabase Integration Client & Realtime Synchronization Layer
 * Connects to Supabase when environment credentials exist, and provides an
 * instant, zero-configuration local persistent fallback engine with Supabase-compatible
 * table schemas, realtime subscriptions, image uploads, and query capabilities.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment credentials (if configured by user in .env)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

// Realtime event emitter for application-wide instantaneous sync
type RealtimeCallback = (payload: { event: string; table: string; new: any; old: any }) => void;
const realtimeListeners: Map<string, Set<RealtimeCallback>> = new Map();

export const emitRealtimeEvent = (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', record: any, oldRecord?: any) => {
  const listeners = realtimeListeners.get(table);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb({ event, table, new: record, old: oldRecord || record });
      } catch (e) {
        console.error('Error in realtime listener callback', e);
      }
    });
  }
};

export const subscribeToTable = (table: string, callback: RealtimeCallback) => {
  if (!realtimeListeners.has(table)) {
    realtimeListeners.set(table, new Set());
  }
  realtimeListeners.get(table)!.add(callback);

  return () => {
    const set = realtimeListeners.get(table);
    if (set) {
      set.delete(callback);
    }
  };
};

// Safe local persistent storage helpers
const getTableData = (table: string): any[] => {
  try {
    const raw = localStorage.getItem(`resqzone_table_${table}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setTableData = (table: string, data: any[]) => {
  try {
    localStorage.setItem(`resqzone_table_${table}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Storage quota exceeded for table ${table}`, e);
  }
};

// Initialize Supabase client if configured
let clientInstance: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn('Failed to initialize live Supabase client, falling back to local engine', e);
    clientInstance = null;
  }
}

export const supabase = clientInstance;

/**
 * Universal database query layer that works with or without a live Supabase instance.
 */
export const db = {
  // Profiles
  async getProfile(userId: string) {
    if (clientInstance) {
      const { data, error } = await clientInstance
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) return data;
    }
    const profiles = getTableData('profiles');
    return profiles.find((p) => p.id === userId) || null;
  },

  async upsertProfile(profile: any) {
    const enriched = {
      ...profile,
      updated_at: new Date().toISOString(),
    };

    if (clientInstance) {
      try {
        await clientInstance.from('profiles').upsert(enriched);
      } catch (e) {
        console.warn('Supabase profiles upsert error, saved locally', e);
      }
    }

    const profiles = getTableData('profiles');
    const existingIndex = profiles.findIndex((p) => p.id === enriched.id);
    if (existingIndex >= 0) {
      profiles[existingIndex] = { ...profiles[existingIndex], ...enriched };
      emitRealtimeEvent('profiles', 'UPDATE', profiles[existingIndex]);
    } else {
      profiles.push(enriched);
      emitRealtimeEvent('profiles', 'INSERT', enriched);
    }
    setTableData('profiles', profiles);
    return enriched;
  },

  // Citizen Reports
  async insertCitizenReport(report: any) {
    const record = {
      ...report,
      id: report.id || `CIT-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      status: report.status || 'NEW',
    };

    if (clientInstance) {
      try {
        await clientInstance.from('citizen_reports').insert(record);
      } catch (e) {
        console.warn('Supabase citizen_reports insert error', e);
      }
    }

    const reports = getTableData('citizen_reports');
    reports.unshift(record);
    setTableData('citizen_reports', reports);
    emitRealtimeEvent('citizen_reports', 'INSERT', record);
    return record;
  },

  async getCitizenReports(reporterId?: string) {
    if (clientInstance) {
      try {
        let query = clientInstance.from('citizen_reports').select('*').order('created_at', { ascending: false });
        if (reporterId) query = query.eq('reporter_id', reporterId);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase query error', e);
      }
    }

    const reports = getTableData('citizen_reports');
    if (reporterId) {
      return reports.filter((r) => r.reporter_id === reporterId);
    }
    return reports;
  },

  async updateReportStatus(reportId: string, status: string, notes?: string) {
    if (clientInstance) {
      try {
        await clientInstance.from('citizen_reports').update({ status, authority_notes: notes }).eq('id', reportId);
      } catch (e) {
        console.warn('Supabase update error', e);
      }
    }

    const reports = getTableData('citizen_reports');
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx >= 0) {
      reports[idx].status = status;
      if (notes) reports[idx].authority_notes = notes;
      setTableData('citizen_reports', reports);
      emitRealtimeEvent('citizen_reports', 'UPDATE', reports[idx]);
      return reports[idx];
    }
    return null;
  },

  // Incidents alias for citizen_reports
  async insertIncident(incident: any) {
    return this.insertCitizenReport(incident);
  },

  async getIncidents(reporterId?: string) {
    return this.getCitizenReports(reporterId);
  },

  // Rescue Requests
  async insertRescueRequest(request: any) {
    const record = {
      ...request,
      id: request.id || `RQ-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      status: request.status || 'SUBMITTED',
    };

    if (clientInstance) {
      try {
        await clientInstance.from('rescue_requests').insert(record);
      } catch (e) {
        console.warn('Supabase rescue_requests insert error', e);
      }
    }

    const requests = getTableData('rescue_requests');
    requests.unshift(record);
    setTableData('rescue_requests', requests);
    emitRealtimeEvent('rescue_requests', 'INSERT', record);
    return record;
  },

  async getRescueRequests(userId?: string) {
    if (clientInstance) {
      try {
        let query = clientInstance.from('rescue_requests').select('*').order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase rescue_requests query error', e);
      }
    }

    const requests = getTableData('rescue_requests');
    if (userId) {
      return requests.filter((r) => r.user_id === userId || r.userId === userId);
    }
    return requests;
  },

  async updateRescueRequest(id: string, updates: any) {
    if (clientInstance) {
      try {
        await clientInstance.from('rescue_requests').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase rescue_requests update error', e);
      }
    }

    const requests = getTableData('rescue_requests');
    const idx = requests.findIndex((r) => r.id === id);
    if (idx >= 0) {
      requests[idx] = { ...requests[idx], ...updates };
      setTableData('rescue_requests', requests);
      emitRealtimeEvent('rescue_requests', 'UPDATE', requests[idx]);
      return requests[idx];
    }
    return null;
  },

  // Image Upload helper (supports File or base64 DataURL)
  async uploadImage(fileOrDataUrl: File | string, folder = 'disaster-reports'): Promise<string> {
    if (typeof fileOrDataUrl === 'string') {
      // DataURL or remote link is already valid
      return fileOrDataUrl;
    }

    if (clientInstance) {
      try {
        const fileExt = fileOrDataUrl.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error } = await clientInstance.storage.from('resqzone-media').upload(fileName, fileOrDataUrl);
        if (!error) {
          const { data } = clientInstance.storage.from('resqzone-media').getPublicUrl(fileName);
          if (data?.publicUrl) return data.publicUrl;
        }
      } catch (e) {
        console.warn('Supabase storage upload error, converting to local dataURL', e);
      }
    }

    // Fallback: convert File to Data URL for instant local storage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
    });
  },
};
