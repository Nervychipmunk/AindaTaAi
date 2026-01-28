import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Title, Text, Card } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function RoleSelectionScreen() {
    const [loading, setLoading] = useState(false);
    const { user, refreshProfile } = useAuthStore();

    async function setRole(role: 'hub' | 'connected') {
        if (!user) return;
        setLoading(true);

        // Update profile in Supabase
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', user.id);

        if (error) {
            Alert.alert('Erro', 'Falha ao salvar perfil: ' + error.message);
        } else {
            // Force refresh to update global state and redirect navigation
            await refreshProfile();
        }
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Quem é você?</Title>
            <Text style={styles.subtitle}>Escolha como você vai usar o app</Text>

            <Card style={styles.card} onPress={() => setRole('hub')}>
                <Card.Title title="Sou Responsável (Hub)" subtitle="Quero monitorar e cuidar de alguém" />
                <Card.Content>
                    <Text variant="bodyMedium">
                        Receba alertas se seus conectados não fizerem check-in a tempo.
                    </Text>
                </Card.Content>
                <Card.Actions>
                    <Button mode="contained" onPress={() => setRole('hub')} loading={loading}>
                        Escolher Hub
                    </Button>
                </Card.Actions>
            </Card>

            <Card style={[styles.card, styles.cardSpacer]} onPress={() => setRole('connected')}>
                <Card.Title title="Sou Conectado" subtitle="Quero confirmar que estou bem" />
                <Card.Content>
                    <Text variant="bodyMedium">
                        Receba lembretes para fazer check-in e avise que está tudo certo.
                    </Text>
                </Card.Content>
                <Card.Actions>
                    <Button mode="contained" onPress={() => setRole('connected')} loading={loading}>
                        Escolher Conectado
                    </Button>
                </Card.Actions>
            </Card>

            <Button mode="text" onPress={() => supabase.auth.signOut()} style={styles.logoutButton}>
                Sair
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
        fontSize: 16,
        color: '#666',
    },
    card: {
        marginBottom: 20,
    },
    cardSpacer: {
        marginTop: 10,
    },
    logoutButton: {
        marginTop: 30,
    }
});
