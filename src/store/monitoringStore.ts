import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CheckinRequest } from '../types';

interface MonitoringState {
    latestCheckins: Record<string, CheckinRequest>; // Map connected_id -> Latest Request
    isLoading: boolean;

    fetchLatestCheckins: () => Promise<void>;
    subscribeToUpdates: () => void;
    unsubscribe: () => void;
}

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
    latestCheckins: {},
    isLoading: false,

    fetchLatestCheckins: async () => {
        set({ isLoading: true });

        // Fetch latest request for each connected user
        // This is a bit tricky with basic SQL, for MVP we can just fetch all recent requests
        // Or we rely on Realtime for new ones and just fetch the last 24h ones.

        const { data, error } = await supabase
            .from('checkin_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50); // MVP limit

        if (!error && data) {
            const map: Record<string, CheckinRequest> = {};
            // Process in reverse to ensure latest overwrites
            data.reverse().forEach((req: any) => {
                map[req.connected_id] = req;
            });
            set({ latestCheckins: map });
        }
        set({ isLoading: false });
    },

    subscribeToUpdates: () => {
        const subscription = supabase
            .channel('public:checkin_requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'checkin_requests' },
                (payload) => {
                    console.log('Realtime update:', payload);
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

        // Also listen to responses to update the request status conceptually?
        // Actually, when a response comes, the request status is usually updated by a trigger or backend function?
        // In our current simple MVP logic (step 16), we insert a confirmed request directly.
        // So listening to 'checkin_requests' is enough.
    },

    unsubscribe: () => {
        supabase.removeAllChannels();
    }
}));
