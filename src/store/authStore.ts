import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';

interface AuthState {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    isLoading: true,

    initialize: async () => {
        try {
            set({ isLoading: true });
            const { data: { session } } = await supabase.auth.getSession();

            set({ session, user: session?.user ?? null });

            if (session?.user) {
                await get().refreshProfile();
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            set({ isLoading: false });
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ session, user: session?.user ?? null });
            if (session?.user) {
                await get().refreshProfile();
            } else {
                set({ profile: null });
            }
        });
    },

    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!error && data) {
            set({ profile: data as Profile });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null });
    },
}));
