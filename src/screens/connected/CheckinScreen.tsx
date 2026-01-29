import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, Card, Title, ActivityIndicator, Appbar } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useCheckinStore } from '../../store/checkinStore';

export default function CheckinScreen() {
    const { signOut, user } = useAuthStore();
    const { pendingInvites, activeMonitors, fetchPendingInvites, fetchActiveMonitors, respondToInvite, isLoading } = useConnectionStore();
    const { performCheckin, isSending, lastCheckin } = useCheckinStore();
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchPendingInvites(), fetchActiveMonitors()]);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
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
                <Appbar.Action icon="logout" onPress={() => signOut()} testID="logout-button" accessibilityLabel="logout-button" />
            </Appbar.Header>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadData} />
                }
            >
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

                    {activeMonitors.length > 0 ? (
                        /* Checkin Button (Only if Active Monitor exists) */
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
                                Toque para confirmar com sua biometria.
                                Você está sendo monitorado por {activeMonitors.length} pessoa(s).
                            </Text>
                            {lastCheckin && (
                                <Text style={{ marginTop: 10, textAlign: 'center', color: 'green' }}>
                                    Último check-in: {new Date(lastCheckin).toLocaleTimeString()}
                                </Text>
                            )}
                        </View>
                    ) : (
                        /* Empty State */
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <Text variant="bodyLarge" style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
                                Você ainda não tem monitores ativos.
                            </Text>
                            <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#888' }}>
                                Peça para seu Hub (Responsável) te convidar pelo email ou aceite os convites pendentes acima.
                                Arraste para baixo para atualizar.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
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
