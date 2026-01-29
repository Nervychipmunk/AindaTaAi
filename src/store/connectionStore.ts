import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Connection, Profile } from '../types';

interface ConnectionWithProfile extends Connection {
    connected_user?: Profile; // When I am Hub
    hub_user?: Profile;       // When I am Connected
}

interface ConnectionState {
    connections: ConnectionWithProfile[];
    pendingInvites: ConnectionWithProfile[];
    activeMonitors: ConnectionWithProfile[];
    isLoading: boolean;

    // Hub actions
    fetchConnections: () => Promise<void>;
    addConnection: (email: string) => Promise<{ error?: string }>;

    // Connected actions
    fetchPendingInvites: () => Promise<void>;
    fetchActiveMonitors: () => Promise<void>;
    respondToInvite: (connectionId: string, accept: boolean) => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
    connections: [],
    pendingInvites: [],
    isLoading: false,

    fetchConnections: async () => {
        set({ isLoading: true });

        // Fetch connections where I am the Hub
        const { data, error } = await supabase
            .from('connections')
            .select(`
        *,
        connected_user:profiles!connected_id(*)
      `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const formattedData = data.map((item: any) => ({
                ...item,
                connected_user: item.connected_user
            }));
            set({ connections: formattedData });
        }
        set({ isLoading: false });
    },

    addConnection: async (email: string) => {
        set({ isLoading: true });
        try {
            const { data: userData, error: searchError } = await supabase
                .rpc('get_user_by_email', { email_input: email })
                .maybeSingle<Profile>(); // Use maybeSingle to handle 0 results gracefully and type it as Profile

            if (searchError || !userData) {
                set({ isLoading: false });
                // RPC returns null if no rows found with maybeSingle
                return { error: 'Usuário não encontrado com esse email.' };
            }

            const currentUser = (await supabase.auth.getUser()).data.user;
            if (userData.id === currentUser?.id) {
                set({ isLoading: false });
                return { error: 'Você não pode conectar a si mesmo.' };
            }

            const { error: createError } = await supabase
                .from('connections')
                .insert({
                    hub_id: currentUser!.id,
                    connected_id: userData.id,
                    status: 'pending' // Correct flow: Pending acceptance
                });

            if (createError) {
                if (createError.code === '23505') return { error: 'Usuário já convidado ou conectado.' };
                return { error: createError.message };
            }

            await get().fetchConnections();
            return {};

        } catch (e: any) {
            return { error: e.message };
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPendingInvites: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('connections')
            .select(`
        *,
        hub_user:profiles!hub_id(full_name) 
      `)
            .eq('status', 'pending');
        // RLS already ensures I only see my connections, but we must filter by 'connected_id = me' implicitly via RLS
        // However, the RLS for select allows hub OR connected to see.
        // So we should filter contextually, but 'pending' usually means "waiting for connected".

        if (!error && data) {
            // Filter locally or via query ensuring I am the connected one
            const userId = (await supabase.auth.getUser()).data.user?.id;
            const myInvites = data.filter((c: any) => c.connected_id === userId);

            const formatted = myInvites.map((item: any) => ({
                ...item,
                hub_user: item.hub_user
            }));
            set({ pendingInvites: formatted });
        }
        set({ isLoading: false });
    },

    activeMonitors: [],

    fetchActiveMonitors: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('connections')
            .select(`
        *,
        hub_user:profiles!hub_id(full_name) 
      `)
            .eq('status', 'active');

        if (!error && data) {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            const myMonitors = data.filter((c: any) => c.connected_id === userId);

            const formatted = myMonitors.map((item: any) => ({
                ...item,
                hub_user: item.hub_user
            }));
            set({ activeMonitors: formatted });
        }
        set({ isLoading: false });
    },

    respondToInvite: async (connectionId: string, accept: boolean) => {
        set({ isLoading: true });
        if (accept) {
            await supabase
                .from('connections')
                .update({ status: 'active' })
                .eq('id', connectionId);
        } else {
            await supabase
                .from('connections')
                .delete()
                .eq('id', connectionId);
        }
        await get().fetchPendingInvites();
        await get().fetchActiveMonitors(); // Refresh active monitors after responding
        set({ isLoading: false });
    }
}));
