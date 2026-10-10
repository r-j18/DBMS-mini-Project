export interface Police {
  police_id: number;
  rank: string;
  name: string;
  branch: string;
  age: number;
  number: string | null;
  address: string | null;
  case_count?: number;
}

export interface Criminal {
  criminal_id: number;
  name: string;
  age: number;
  crime: string;
  investigating_officer: number;
  investigation_status: 'Open' | 'Under Investigation' | 'Closed';
  officer_name?: string;
  officer_rank?: string;
  officer_branch?: string;
  court_room_number?: number | null;
  jail_location?: string | null;
  barrack_number?: string | null;
  sentence?: string | null;
  has_photo?: boolean;
  photo_updated_at?: string | null;
}

export interface CriminalProfile {
  criminal: {
    criminal_id: number;
    name: string;
    age: number;
    crime: string;
    investigation_status: 'Open' | 'Under Investigation' | 'Closed';
    has_photo?: boolean;
    photo_updated_at?: string | null;
  };
  officer: {
    police_id: number;
    rank: string;
    name: string;
    branch: string;
    number: string | null;
    address: string | null;
  } | null;
  courtRecord: {
    court_room_number: number;
  } | null;
  jailRecord: {
    location: string;
    barrack_number: string;
    sentence: string;
  } | null;
  timeline: Array<{
    title: string;
    description: string;
    status: string;
  }> | null;
}

export interface OfficerDetail extends Police {
  workload: {
    total: number;
    open: number;
    underInvestigation: number;
    closed: number;
  };
  criminals: Criminal[];
}

export interface CourtRecord {
  court_room_number: number;
  criminal_id: number;
  criminal_name?: string;
  criminal_age?: number;
  crime?: string;
  investigation_status?: string;
  officer_name?: string;
  officer_rank?: string;
}

export interface JailRecord {
  location: string;
  criminal_id: number;
  barrack_number: string;
  sentence: string;
  criminal_name?: string;
  criminal_age?: number;
  crime?: string;
  investigation_status?: string;
  officer_name?: string;
}

export interface JailLocationGroup {
  location: string;
  inmate_count: number;
  inmates: Array<{
    location: string;
    criminal_id: number;
    barrack_number: string;
    sentence: string;
    criminal_name: string;
    crime: string;
  }>;
}

export interface DashboardData {
  stats: {
    totalCriminals: number;
    totalOfficers: number;
    casesByStatus: {
      Open: number;
      'Under Investigation': number;
      Closed: number;
    };
    criminalsInJail: number;
    criminalsWithCourt: number;
    averageAge: number;
  };
  criminalsPerJail: Array<{
    location: string;
    count: number;
  }>;
  criminalsPerOfficer: Array<{
    police_id: number;
    name: string;
    rank: string;
    branch: string;
    case_count: number;
  }>;
  recentRecords: Criminal[];
}

export interface QueryDefinition {
  id: number;
  category: 'Joins' | 'Aggregates' | 'Subqueries';
  title: string;
  description: string;
  sql: string;
}

export interface QueryResult {
  id?: number;
  title?: string;
  sql: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  totalReturned?: number;
  capped?: boolean;
  executionTimeMs: number;
}

export interface SearchResults {
  criminals: Array<{
    criminal_id: number;
    name: string;
    crime: string;
    investigation_status: string;
    officer_name: string;
  }>;
  police: Array<{
    police_id: number;
    rank: string;
    name: string;
    branch: string;
    number: string | null;
  }>;
  courtRecords: Array<{
    court_room_number: number;
    criminal_id: number;
    criminal_name: string;
    crime: string;
  }>;
  jails: Array<{
    location: string;
    criminal_id: number;
    barrack_number: string;
    sentence: string;
    criminal_name: string;
  }>;
}

export type UserRole = 'admin' | 'viewer';

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AuthSessionUser {
  userId: number;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface AuditLogEntry {
  log_id: number;
  user_id: number | null;
  username: string;
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SQL_RUN' | string;
  table_name: string | null;
  record_id: string | null;
  detail: string | null;
  created_at: string;
}
