export type UserRole = 'hub' | 'connected' | null;

export interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    avatar_url?: string;
    push_token?: string | null;
    updated_at?: string;
}

export interface Connection {
    id: string;
    hub_id: string;
    connected_id: string;
    status: 'pending' | 'active';
    daily_checkin_time?: string | null;
    created_at: string;
}

export interface CheckinRequest {
    id: string;
    hub_id: string;
    connected_id: string;
    due_at: string;
    expires_at: string;
    status: 'pending' | 'confirmed' | 'overdue';
    created_at: string;
}

export interface CheckinResponse {
    id: string;
    request_id: string;
    connected_id: string;
    auth_method: string;
    payload?: string;
    created_at: string;
}
