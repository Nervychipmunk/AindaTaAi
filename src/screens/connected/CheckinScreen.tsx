import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, Title, ActivityIndicator, Appbar } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useCheckinStore } from '../../store/checkinStore';

export default function CheckinScreen() {
    const { signOut, user } = useAuthStore();
    const { pendingInvites, fetchPendingInvites, respondToInvite } = useConnectionStore();
    const { performCheckin, isSending, lastCheckin } = useCheckinStore();

    useEffect(() => {
        fetchPendingInvites();
    }, []);

    const handleRespond = (id: string, accept: boolean) => {
        Alert.alert(
            accept ? 'Aceitar Conexão' : 'Recusar',
            accept ? 'Deseja permitir que essa pessoa te monitore?' : 'Deseja recusar o convite?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => await respondToInvite(id, accept)
                }
            ]
        );
    };

    const renderInvite = ({ item }: { item: any }) => (
        <Card style={styles.inviteCard}>
            <Card.Title
                title="Convite de Monitoramento"
                subtitle={`${item.hub_user?.full_name || 'Alguém'} quer te monitorar.`}
            />
            <Card.Actions>
                <Button onPress={() => handleRespond(item.id, false)} color="red">Recusar</Button>
                <Button mode="contained" onPress={() => handleRespond(item.id, true)}>Aceitar</Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Check-in" />
                <Appbar.Action icon="logout" onPress={() => signOut()} />
            </Appbar.Header>

            <View style={styles.content}>
                {pendingInvites.length > 0 && (
                    <View style={styles.invitesSection}>
                        <Title style={styles.sectionTitle}>Convites Pendentes</Title>
                        <FlatList
                            data={pendingInvites}
                            keyExtractor={item => item.id}
                            renderItem={renderInvite}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                <View style={styles.checkinArea}>
                    <Text variant="headlineMedium" style={styles.greeting}>Olá, {user?.email}</Text>

                    {/* Checkin Button */}
                    <View style={styles.placeholderButton}>
                        <Button
                            mode="contained"
                            contentStyle={{ height: 120 }}
                            labelStyle={{ fontSize: 24, fontWeight: 'bold' }}
                            style={{ borderRadius: 20, justifyContent: 'center' }}
                            onPress={performCheckin}
                            loading={isSending}
                            disabled={isSending}
                            icon="fingerprint"
                        >
                            ESTOU BEM
                        </Button>
                        <Text style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
                            Toque para confirmar com sua biometria
                        </Text>
                        {lastCheckin && (
                            <Text style={{ marginTop: 10, textAlign: 'center', color: 'green' }}>
                                Último check-in: {new Date(lastCheckin).toLocaleTimeString()}
                            </Text>
                        )}
                    </View>       </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
        flex: 1,
    },
    invitesSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 10,
        color: '#6200ee'
    },
    inviteCard: {
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    checkinArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    greeting: {
        marginBottom: 30,
    },
    placeholderButton: {
        width: '100%',
        paddingHorizontal: 20
    }
});
