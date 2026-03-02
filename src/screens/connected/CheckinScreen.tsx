import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, Card, Title, ActivityIndicator, Appbar } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useCheckinStore } from '../../store/checkinStore';

export default function CheckinScreen() {
    const { signOut, user } = useAuthStore();
    const { pendingInvites, activeMonitors, fetchPendingInvites, fetchActiveMonitors, respondToInvite } = useConnectionStore();
    const { pendingRequests, fetchPendingRequests, performCheckin, isSending, lastCheckin, isLoading: isRequestsLoading } = useCheckinStore();
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchPendingInvites(), fetchActiveMonitors(), fetchPendingRequests()]);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleRespond = (id: string, accept: boolean) => {
        Alert.alert(
            accept ? 'Aceitar Conexao' : 'Recusar',
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
                subtitle={`${item.hub_user?.full_name || 'Alguem'} quer te monitorar.`}
            />
            <Card.Actions>
                <Button onPress={() => handleRespond(item.id, false)} textColor="red">Recusar</Button>
                <Button mode="contained" onPress={() => handleRespond(item.id, true)}>Aceitar</Button>
            </Card.Actions>
        </Card>
    );

    const renderRequest = ({ item }: { item: any }) => (
        <Card style={styles.requestCard}>
            <Card.Title
                title="Check-in diario"
                subtitle={`Hub: ${item.hub_user?.full_name || 'Seu hub'}`}
            />
            <Card.Content>
                <Text variant="bodyMedium" style={styles.requestText}>
                    Responda ate {new Date(item.expires_at).toLocaleTimeString()}.
                </Text>
            </Card.Content>
            <Card.Actions>
                <Button
                    mode="contained"
                    onPress={() => performCheckin(item.id)}
                    loading={isSending}
                    disabled={isSending}
                    icon="fingerprint"
                >
                    Confirmar
                </Button>
            </Card.Actions>
        </Card>
    );

    const showEmptyState = pendingRequests.length === 0 && !isRequestsLoading;

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
                    <Text variant="headlineMedium" style={styles.greeting}>Ola, {user?.email}</Text>

                    {isRequestsLoading && pendingRequests.length === 0 && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" />
                        </View>
                    )}

                    {pendingRequests.length > 0 && (
                        <View style={styles.requestsSection}>
                            <Title style={styles.sectionTitle}>Check-ins Pendentes</Title>
                            <FlatList
                                data={pendingRequests}
                                keyExtractor={item => item.id}
                                renderItem={renderRequest}
                                scrollEnabled={false}
                            />
                        </View>
                    )}

                    {showEmptyState && (
                        <View style={styles.emptyState}>
                            <Text variant="bodyLarge" style={styles.emptyTitle}>
                                Nenhum check-in pendente no momento.
                            </Text>
                            {activeMonitors.length > 0 ? (
                                <Text variant="bodyMedium" style={styles.emptyText}>
                                    Aguarde o horario diario definido pelo seu hub.
                                </Text>
                            ) : (
                                <Text variant="bodyMedium" style={styles.emptyText}>
                                    Voce ainda nao tem monitores ativos. Peca para um hub te convidar.
                                </Text>
                            )}
                        </View>
                    )}

                    {lastCheckin && (
                        <Text style={styles.lastCheckin}>
                            Ultimo check-in: {new Date(lastCheckin).toLocaleTimeString()}
                        </Text>
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
    requestsSection: {
        width: '100%',
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
    requestCard: {
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    requestText: {
        color: '#666',
    },
    checkinArea: {
        flex: 1,
        alignItems: 'stretch',
    },
    greeting: {
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyTitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
    },
    lastCheckin: {
        marginTop: 10,
        textAlign: 'center',
        color: 'green',
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    }
});
