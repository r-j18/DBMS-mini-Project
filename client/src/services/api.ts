import {
  Police,
  Criminal,
  CriminalProfile,
  OfficerDetail,
  CourtRecord,
  JailRecord,
  JailLocationGroup,
  DashboardData,
  QueryDefinition,
  QueryResult,
  SearchResults,
  User,
  AuthSessionUser,
  AuditLogEntry,
} from '../types';

const API_BASE = '/api';

async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With', 'XMLHttpRequest');

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Transmit and store cookies
  };

  const res = await fetch(url, config);

  if (res.status === 401) {
    // Only dispatch if not an initial /api/auth/me or /api/auth/login check
    if (!url.includes('/api/auth/login') && !url.includes('/api/auth/me')) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: 'Session expired' }));
    }
  } else if (res.status === 403) {
    window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: 'You do not have permission to do that.' }));
  }

  return res;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Authentication
  login: (data: { username: string; password: string }): Promise<{ success: boolean; user: AuthSessionUser }> =>
    customFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; user: AuthSessionUser }>(r)),

  logout: (): Promise<{ success: boolean; message: string }> =>
    customFetch(`${API_BASE}/auth/logout`, { method: 'POST' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),

  getMe: (): Promise<{ user: AuthSessionUser }> =>
    customFetch(`${API_BASE}/auth/me`).then((r) => handleResponse<{ user: AuthSessionUser }>(r)),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> =>
    customFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),

  // Users (Admin only)
  getUsers: (): Promise<{ users: User[] }> =>
    customFetch(`${API_BASE}/users`).then((r) => handleResponse<{ users: User[] }>(r)),

  createUser: (data: { username: string; full_name: string; password: string; role: 'admin' | 'viewer' }): Promise<{ success: boolean; user: User }> =>
    customFetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; user: User }>(r)),

  updateUser: (id: number, data: Partial<{ full_name: string; role: 'admin' | 'viewer'; is_active: boolean; password?: string }>): Promise<{ success: boolean; message: string }> =>
    customFetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),

  // Audit Log (Admin only)
  getAuditLogs: (params: Record<string, string | number> = {}): Promise<{ data: AuditLogEntry[]; pagination: any }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });
    return customFetch(`${API_BASE}/audit-log?${query.toString()}`).then((r) =>
      handleResponse<{ data: AuditLogEntry[]; pagination: any }>(r)
    );
  },

  // Dashboard
  getDashboard: (): Promise<DashboardData> =>
    customFetch(`${API_BASE}/dashboard`).then((r) => handleResponse<DashboardData>(r)),

  // Criminals
  getCriminals: (params: Record<string, string | number> = {}): Promise<{ data: Criminal[]; pagination: any }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });
    return customFetch(`${API_BASE}/criminals?${query.toString()}`).then((r) =>
      handleResponse<{ data: Criminal[]; pagination: any }>(r)
    );
  },

  getCriminalProfile: (id: number): Promise<CriminalProfile> =>
    customFetch(`${API_BASE}/criminals/${id}`).then((r) => handleResponse<CriminalProfile>(r)),

  createCriminal: (data: Partial<Criminal>): Promise<{ message: string; criminal_id: number }> =>
    customFetch(`${API_BASE}/criminals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string; criminal_id: number }>(r)),

  updateCriminal: (id: number, data: Partial<Criminal>): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/criminals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deleteCriminal: (id: number): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/criminals/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ message: string }>(r)
    ),

  // Police
  getPoliceList: (params: Record<string, string | number> = {}): Promise<{ data: Police[]; pagination: any }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });
    return customFetch(`${API_BASE}/police?${query.toString()}`).then((r) =>
      handleResponse<{ data: Police[]; pagination: any }>(r)
    );
  },

  getPoliceDetail: (id: number): Promise<OfficerDetail> =>
    customFetch(`${API_BASE}/police/${id}`).then((r) => handleResponse<OfficerDetail>(r)),

  createPolice: (data: Partial<Police>): Promise<{ message: string; police_id: number }> =>
    customFetch(`${API_BASE}/police`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string; police_id: number }>(r)),

  updatePolice: (id: number, data: Partial<Police>): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/police/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deletePolice: (id: number): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/police/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ message: string }>(r)
    ),

  // Court Records
  getCourtRecords: (params: Record<string, string | number> = {}): Promise<{ data: CourtRecord[]; pagination: any }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });
    return customFetch(`${API_BASE}/court-records?${query.toString()}`).then((r) =>
      handleResponse<{ data: CourtRecord[]; pagination: any }>(r)
    );
  },

  getUnassignedCriminalsForCourt: (includeCriminalId?: number): Promise<Array<{ criminal_id: number; name: string; crime: string }>> => {
    const q = includeCriminalId ? `?includeCriminalId=${includeCriminalId}` : '';
    return customFetch(`${API_BASE}/court-records/unassigned-criminals${q}`).then((r) =>
      handleResponse<Array<{ criminal_id: number; name: string; crime: string }>>(r)
    );
  },

  createCourtRecord: (data: { court_room_number: number; criminal_id: number }): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/court-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  updateCourtRecord: (court_room_number: number, data: { criminal_id: number }): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/court-records/${court_room_number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deleteCourtRecord: (court_room_number: number): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/court-records/${court_room_number}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ message: string }>(r)
    ),

  // Jail
  getJailRecords: (params: Record<string, string | number> = {}): Promise<{ data: JailRecord[]; pagination: any }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });
    return customFetch(`${API_BASE}/jail?${query.toString()}`).then((r) =>
      handleResponse<{ data: JailRecord[]; pagination: any }>(r)
    );
  },

  getJailLocations: (): Promise<JailLocationGroup[]> =>
    customFetch(`${API_BASE}/jail/facilities`).then((r) => handleResponse<JailLocationGroup[]>(r)),

  getUnassignedCriminalsForJail: (includeCriminalId?: number): Promise<Array<{ criminal_id: number; name: string; crime: string }>> => {
    const q = includeCriminalId ? `?includeCriminalId=${includeCriminalId}` : '';
    return customFetch(`${API_BASE}/jail/unassigned-criminals${q}`).then((r) =>
      handleResponse<Array<{ criminal_id: number; name: string; crime: string }>>(r)
    );
  },

  createJailRecord: (data: { location: string; criminal_id: number; barrack_number: string; sentence: string }): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/jail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  updateJailRecord: (criminal_id: number, data: { location: string; barrack_number: string; sentence: string }): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/jail/${criminal_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deleteJailRecord: (criminal_id: number): Promise<{ message: string }> =>
    customFetch(`${API_BASE}/jail/${criminal_id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ message: string }>(r)
    ),

  // Queries (Saved queries run)
  getQueries: (): Promise<QueryDefinition[]> =>
    customFetch(`${API_BASE}/queries`).then((r) => handleResponse<QueryDefinition[]>(r)),

  runQuery: (id: number): Promise<QueryResult> =>
    customFetch(`${API_BASE}/queries/${id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then((r) => handleResponse<QueryResult>(r)),

  // SQL Console (Admin only)
  runSqlConsole: (query: string): Promise<QueryResult> =>
    customFetch(`${API_BASE}/sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    }).then((r) => handleResponse<QueryResult>(r)),

  // Search
  searchGlobal: (query: string): Promise<SearchResults> =>
    customFetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`).then((r) =>
      handleResponse<SearchResults>(r)
    ),
};
