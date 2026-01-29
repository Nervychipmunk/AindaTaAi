import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CheckinRequest } from '../types';

interface MonitoringState {
    latestCheckins: Record<string, CheckinRequest>; // Map connected_id -> Latest Request
    isLoading: boolean;

    fetchLatestCheckins: () => Promise<void>;
    subscribeToUpdates: () => Promise<void>;
    unsubscribe: () => void;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
    latestCheckins: {},
    isLoading: false,

    fetchLatestCheckins: async () => {
        set({ isLoading: true });

        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            set({ latestCheckins: {}, isLoading: false });
            return;
        }

        const { data, error } = await supabase
            .from('checkin_requests')
            .select('*')
            .eq('hub_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50); // MVP limit

        if (!error && data) {
            const map: Record<string, CheckinRequest> = {};
            data.reverse().forEach((req: any) => {
                map[req.connected_id] = req;
            });
            set({ latestCheckins: map });
        }
        set({ isLoading: false });
    },

    subscribeToUpdates: async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        supabase
            .channel('public:checkin_requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'checkin_requests', filter: `hub_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newReq = payload.new as CheckinRequest;
                        set((state) => ({
                            latestCheckins: {
                                ...state.latestCheckins,
                                [newReq.connected_id]: newReq
                            }
                        }));
                    }
                }
            )
            .subscribe();
    },

    unsubscribe: () => {
        supabase.removeAllChannels();
    }
}));
