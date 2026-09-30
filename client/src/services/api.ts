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
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      // Fallback to status text
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: (): Promise<DashboardData> =>
    fetch(`${API_BASE}/dashboard`).then((r) => handleResponse<DashboardData>(r)),

  // Criminals
  getCriminals: (params: Record<string, string | number> = {}): Promise<{ data: Criminal[]; pagination: any }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) {
        query.append(k, String(v));
      }
    });
    return fetch(`${API_BASE}/criminals?${query.toString()}`).then((r) =>
      handleResponse<{ data: Criminal[]; pagination: any }>(r)
    );
  },

  getCriminalProfile: (id: number): Promise<CriminalProfile> =>
    fetch(`${API_BASE}/criminals/${id}`).then((r) => handleResponse<CriminalProfile>(r)),

  createCriminal: (data: Partial<Criminal>): Promise<{ message: string; criminal_id: number }> =>
    fetch(`${API_BASE}/criminals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string; criminal_id: number }>(r)),

  updateCriminal: (id: number, data: Partial<Criminal>): Promise<{ message: string }> =>
    fetch(`${API_BASE}/criminals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deleteCriminal: (id: number): Promise<{ message: string }> =>
    fetch(`${API_BASE}/criminals/${id}`, { method: 'DELETE' }).then((r) =>
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
    return fetch(`${API_BASE}/police?${query.toString()}`).then((r) =>
      handleResponse<{ data: Police[]; pagination: any }>(r)
    );
  },

  getPoliceDetail: (id: number): Promise<OfficerDetail> =>
    fetch(`${API_BASE}/police/${id}`).then((r) => handleResponse<OfficerDetail>(r)),

  createPolice: (data: Partial<Police>): Promise<{ message: string; police_id: number }> =>
    fetch(`${API_BASE}/police`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string; police_id: number }>(r)),

  updatePolice: (id: number, data: Partial<Police>): Promise<{ message: string }> =>
    fetch(`${API_BASE}/police/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deletePolice: (id: number): Promise<{ message: string }> =>
    fetch(`${API_BASE}/police/${id}`, { method: 'DELETE' }).then((r) =>
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
    return fetch(`${API_BASE}/court-records?${query.toString()}`).then((r) =>
      handleResponse<{ data: CourtRecord[]; pagination: any }>(r)
    );
  },

  getUnassignedCriminalsForCourt: (includeCriminalId?: number): Promise<Array<{ criminal_id: number; name: string; crime: string }>> => {
    const q = includeCriminalId ? `?includeCriminalId=${includeCriminalId}` : '';
    return fetch(`${API_BASE}/court-records/unassigned-criminals${q}`).then((r) =>
      handleResponse<Array<{ criminal_id: number; name: string; crime: string }>>(r)
    );
  },

  createCourtRecord: (data: { court_room_number: number; criminal_id: number }): Promise<{ message: string }> =>
    fetch(`${API_BASE}/court-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  updateCourtRecord: (court_room_number: number, data: { criminal_id: number }): Promise<{ message: string }> =>
    fetch(`${API_BASE}/court-records/${court_room_number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deleteCourtRecord: (court_room_number: number): Promise<{ message: string }> =>
    fetch(`${API_BASE}/court-records/${court_room_number}`, { method: 'DELETE' }).then((r) =>
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
    return fetch(`${API_BASE}/jail?${query.toString()}`).then((r) =>
      handleResponse<{ data: JailRecord[]; pagination: any }>(r)
    );
  },

  getJailLocations: (): Promise<JailLocationGroup[]> =>
    fetch(`${API_BASE}/jail/locations`).then((r) => handleResponse<JailLocationGroup[]>(r)),

  getUnassignedCriminalsForJail: (includeCriminalId?: number): Promise<Array<{ criminal_id: number; name: string; crime: string }>> => {
    const q = includeCriminalId ? `?includeCriminalId=${includeCriminalId}` : '';
    return fetch(`${API_BASE}/jail/unassigned-criminals${q}`).then((r) =>
      handleResponse<Array<{ criminal_id: number; name: string; crime: string }>>(r)
    );
  },

  createJailRecord: (data: { location: string; criminal_id: number; barrack_number: string; sentence: string }): Promise<{ message: string }> =>
    fetch(`${API_BASE}/jail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  updateJailRecord: (criminal_id: number, data: { location: string; barrack_number: string; sentence: string }): Promise<{ message: string }> =>
    fetch(`${API_BASE}/jail/${criminal_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string }>(r)),

  deleteJailRecord: (criminal_id: number): Promise<{ message: string }> =>
    fetch(`${API_BASE}/jail/${criminal_id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ message: string }>(r)
    ),

  // Queries
  getQueries: (): Promise<QueryDefinition[]> =>
    fetch(`${API_BASE}/queries`).then((r) => handleResponse<QueryDefinition[]>(r)),

  runQuery: (id: number): Promise<QueryResult> =>
    fetch(`${API_BASE}/queries/${id}/run`, { method: 'POST' }).then((r) =>
      handleResponse<QueryResult>(r)
    ),

  // SQL Console
  runSqlConsole: (query: string): Promise<QueryResult> =>
    fetch(`${API_BASE}/sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    }).then((r) => handleResponse<QueryResult>(r)),

  // Search
  searchGlobal: (query: string): Promise<SearchResults> =>
    fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`).then((r) =>
      handleResponse<SearchResults>(r)
    ),
};
