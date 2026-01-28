import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

interface CheckinState {
    isSending: boolean;
    lastCheckin: string | null;

    performCheckin: () => Promise<void>;
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
    isSending: false,
    lastCheckin: null,

    performCheckin: async () => {
        try {
            set({ isSending: true });

            // 1. Verify Biometrics/Device Auth
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Confirme que você está bem',
                    fallbackLabel: 'Usar Senha do Celular',
                    cancelLabel: 'Cancelar',
                    disableDeviceFallback: false,
                });

                if (!result.success) {
                    Alert.alert('Autenticação cancelada', 'Não pudemos confirmar sua identidade.');
                    set({ isSending: false });
                    return;
                }
            } else {
                // Fallback for emulators or devices without secure lock
                Alert.alert('Aviso', 'Dispositivo sem segurança configurada. Check-in será enviado sem biometria.');
            }

            // 2. Send to Supabase
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Usuário não autenticado');

            // For MVP, we are creating a checkin_response directly.
            // Ideally, this should link to a request, but we support spontaneous check-ins too.
            // We will create a dummy request or just insert into responses if schema allows nullable request_id
            // Reviewing schema: request_id is NOT NULL. So we need a request.
            // Strategy: Create a "Self-initiated" request first, then respond to it.

            const { data: requestData, error: reqError } = await supabase
                .from('checkin_requests')
                .insert({
                    // Actually, for spontaneous, let's just pick the first connected hub or self. 
                    // EDIT: Schema constraint says request_id refers to checkin_requests.
                    // Let's create a request from "Me" to "Me" just to satisfy FK, or fetch my active hub connections.

                    // Better MVP approach: Find my active connection (Hub)
                    // If multiple hubs, we broadcast to all? 
                    // For simplicity: We insert one "Global Checkin" request where hub_id is myself (as a system placeholder) 
                    // OR we alter schema to make request_id optional.

                    // Let's create a request where hub_id = connected_id (self-checkin)
                    hub_id: user.id,
                    connected_id: user.id,
                    due_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour
                    status: 'confirmed'
                })
                .select()
                .single();

            if (reqError) throw reqError;

            const { error: respError } = await supabase
                .from('checkin_responses')
                .insert({
                    request_id: requestData.id,
                    connected_id: user.id,
                    auth_method: hasHardware ? 'biometrics' : 'manual',
                    payload: 'Check-in Espontâneo'
                });

            if (respError) throw respError;

            set({ lastCheckin: new Date().toISOString() });
            Alert.alert('Sucesso', 'Você confirmou que está bem!');

        } catch (e: any) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao enviar check-in: ' + e.message);
        } finally {
            set({ isSending: false });
        }
    }
}));
