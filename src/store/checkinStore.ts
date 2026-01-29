import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { CheckinRequest, Profile } from '../types';

type PendingCheckinRequest = CheckinRequest & {
    hub_user?: Pick<Profile, 'full_name'>;
};

interface CheckinState {
    isSending: boolean;
    isLoading: boolean;
    lastCheckin: string | null;
    pendingRequests: PendingCheckinRequest[];

    fetchPendingRequests: () => Promise<void>;
    performCheckin: (requestId: string) => Promise<void>;
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
    isSending: false,
    isLoading: false,
    lastCheckin: null,
    pendingRequests: [],

    fetchPendingRequests: async () => {
        set({ isLoading: true });
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                set({ pendingRequests: [] });
                return;
            }

            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('checkin_requests')
                .select(`
                    *,
                    hub_user:profiles!hub_id(full_name)
                `)
                .eq('connected_id', user.id)
                .eq('status', 'pending')
                .gt('expires_at', now)
                .order('due_at', { ascending: true });

            if (!error && data) {
                set({ pendingRequests: data as PendingCheckinRequest[] });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    performCheckin: async (requestId: string) => {
        try {
            set({ isSending: true });

            // 1. Verify Biometrics/Device Auth
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Confirme que voce esta bem',
                    fallbackLabel: 'Usar senha do celular',
                    cancelLabel: 'Cancelar',
                    disableDeviceFallback: false,
                });

                if (!result.success) {
                    Alert.alert('Autenticacao cancelada', 'Nao pudemos confirmar sua identidade.');
                    set({ isSending: false });
                    return;
                }
            } else {
                console.log('Biometria nao disponivel (Emulador). Simulando sucesso.');
            }

            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Usuario nao autenticado');

            const { error: updateError } = await supabase
                .from('checkin_requests')
                .update({ status: 'confirmed' })
                .eq('id', requestId);

            if (updateError) throw updateError;

            const { error: respError } = await supabase
                .from('checkin_responses')
                .insert({
                    request_id: requestId,
                    connected_id: user.id,
                    auth_method: hasHardware ? 'biometrics' : 'manual',
                    payload: 'Check-in confirmado'
                });

            if (respError) throw respError;

            set({ lastCheckin: new Date().toISOString() });
            Alert.alert('Sucesso', 'Voce confirmou que esta bem!');
            await get().fetchPendingRequests();
        } catch (e: any) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao enviar check-in: ' + e.message);
        } finally {
            set({ isSending: false });
        }
    }
}));
