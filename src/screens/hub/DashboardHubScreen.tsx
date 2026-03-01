import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, FAB, Portal, Dialog, TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useMonitoringStore } from '../../store/monitoringStore';
import { Connection } from '../../types';

type ConnectionItem = Connection & {
    connected_user?: { full_name?: string | null };
};

export default function DashboardHubScreen() {
    const { signOut } = useAuthStore();
    const { connections, fetchConnections, addConnection, updateDailyCheckinTime, isLoading } = useConnectionStore();
    const { latestCheckins, fetchLatestCheckins, subscribeToUpdates, unsubscribe } = useMonitoringStore();

    const [visible, setVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [adding, setAdding] = useState(false);

    const [scheduleVisible, setScheduleVisible] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState<ConnectionItem | null>(null);
    const [scheduleTime, setScheduleTime] = useState('');
    const [savingSchedule, setSavingSchedule] = useState(false);

    useEffect(() => {
        fetchConnections();
        fetchLatestCheckins();
        subscribeToUpdates();

        return () => {
            unsubscribe();
        };
    }, []);

    const showDialog = () => setVisible(true);
    const hideDialog = () => {
        setVisible(false);
        setEmail('');
    };

    const showScheduleDialog = (connection: ConnectionItem) => {
        setSelectedConnection(connection);
        setScheduleTime(formatTime(connection.daily_checkin_time));
        setScheduleVisible(true);
    };

    const hideScheduleDialog = () => {
        setScheduleVisible(false);
        setSelectedConnection(null);
        setScheduleTime('');
    };

    const handleAddConnection = async () => {
        if (!email) return;
        setAdding(true);
        const result = await addConnection(email);
        setAdding(false);

        if (result.error) {
            Alert.alert('Erro', result.error);
        } else {
            Alert.alert('Sucesso', 'Conexao adicionada!', [
                {
                    text: 'OK',
                    onPress: () => {
                        hideDialog();
                        fetchConnections();
                    }
                }
            ]);
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedConnection) return;

        if (!isValidTime(scheduleTime)) {
            Alert.alert('Horario invalido', 'Use HH:MM (24h).');
            return;
        }

        setSavingSchedule(true);
        const result = await updateDailyCheckinTime(selectedConnection.id, normalizeTime(scheduleTime));
        setSavingSchedule(false);

        if (result.error) {
            Alert.alert('Erro', result.error);
        } else {
            hideScheduleDialog();
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'confirmed':
                return 'green';
            case 'overdue':
                return 'red';
            default:
                return '#666';
        }
    };

    const renderItem = ({ item }: { item: ConnectionItem }) => {
        const lastRequest = latestCheckins[item.connected_id];
        const statusText = item.status === 'pending'
            ? 'Convite pendente'
            : (lastRequest?.status ? `Check-in: ${lastRequest.status}` : 'Sem dados recentes');

        const statusColor = item.status === 'pending' ? 'orange' : getStatusColor(lastRequest?.status);
        const displayName = item.connected_user?.full_name || 'Usuario sem nome';
        const scheduleLabel = item.daily_checkin_time ? formatTime(item.daily_checkin_time) : 'Nao definido';

        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{String(displayName)}</Text>
                <Text style={{ color: statusColor }}>{String(statusText)}</Text>
                <Text style={styles.cardSubtitle}>Horario diario: {scheduleLabel}</Text>
                <Button
                    mode="outlined"
                    onPress={() => showScheduleDialog(item)}
                    disabled={item.status !== 'active'}
                    style={styles.scheduleButton}
                >
                    {item.daily_checkin_time ? 'Editar horario' : 'Definir horario'}
                </Button>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Meus Conectados" />
                <Appbar.Action
                    icon="logout"
                    onPress={() => signOut()}
                    accessibilityLabel="logout-button"
                    testID="logout-button"
                />
            </Appbar.Header>

            {isLoading && connections.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : connections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="bodyLarge" style={styles.emptyText}>
                        Voce ainda nao monitora ninguem.
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubtext}>
                        Toque no + para adicionar alguem pelo email.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={connections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshing={isLoading}
                    onRefresh={fetchConnections}
                />
            )}

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={showDialog}
                label="Adicionar"
                testID="add-connection-fab"
                accessibilityLabel="add-connection-fab"
            />

            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>Adicionar Conectado</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ marginBottom: 10 }}>
                            Digite o email da pessoa que voce quer monitorar. Ela deve ter uma conta no app.
                        </Text>
                        <TextInput
                            label="Email do Conectado"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog}>Cancelar</Button>
                        <Button
                            onPress={handleAddConnection}
                            loading={adding}
                            disabled={adding}
                            testID="add-connection-submit"
                            accessibilityLabel="add-connection-submit"
                        >
                            Adicionar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <Portal>
                <Dialog visible={scheduleVisible} onDismiss={hideScheduleDialog}>
                    <Dialog.Title>Horario diario</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ marginBottom: 10 }}>
                            Defina o horario (HH:MM) para o check-in diario deste conectado.
                        </Text>
                        <TextInput
                            label="Horario"
                            value={scheduleTime}
                            onChangeText={setScheduleTime}
                            keyboardType="numeric"
                            placeholder="08:30"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideScheduleDialog}>Cancelar</Button>
                        <Button
                            onPress={handleSaveSchedule}
                            loading={savingSchedule}
                            disabled={savingSchedule}
                            testID="save-schedule"
                            accessibilityLabel="save-schedule"
                        >
                            Salvar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

function formatTime(value?: string | null) {
    if (!value) return '';
    return value.slice(0, 5);
}

function normalizeTime(value: string) {
    return value.length === 5 ? `${value}:00` : value;
}

function isValidTime(value: string) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContent: {
        padding: 10,
        paddingBottom: 80,
    },
    card: {
        padding: 12,
        backgroundColor: 'white',
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        marginTop: 4,
        color: '#666',
    },
    scheduleButton: {
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#666',
    }
});
