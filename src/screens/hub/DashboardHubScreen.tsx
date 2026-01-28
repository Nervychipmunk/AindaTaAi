import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, List, FAB, Portal, Dialog, TextInput, Button, Avatar, Text, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useMonitoringStore } from '../../store/monitoringStore';
import { Connection } from '../../types';

export default function DashboardHubScreen() {
    const { signOut, user } = useAuthStore();
    const { connections, fetchConnections, addConnection, isLoading } = useConnectionStore();
    const { latestCheckins, fetchLatestCheckins, subscribeToUpdates, unsubscribe } = useMonitoringStore();

    const [visible, setVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchConnections();
        fetchLatestCheckins();
        subscribeToUpdates();

        return () => {
            unsubscribe();
        }
    }, []);

    const showDialog = () => setVisible(true);
    const hideDialog = () => {
        setVisible(false);
        setEmail('');
    };

    const handleAddConnection = async () => {
        if (!email) return;
        setAdding(true);
        const result = await addConnection(email);
        setAdding(false);

        if (result.error) {
            Alert.alert('Erro', result.error);
        } else {
            Alert.alert('Sucesso', 'Conexão adicionada!');
            hideDialog();
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'confirmed': return 'green';
            case 'overdue': return 'red';
            default: return 'gray';
        }
    }

    const renderItem = ({ item }: { item: any }) => {
        const lastRequest = latestCheckins[item.connected_id];
        const statusText = item.status === 'pending' ? 'Convite Pendente' : (lastRequest ? `Check-in: ${lastRequest.status}` : 'Sem dados recentes');
        const statusColor = item.status === 'pending' ? 'orange' : getStatusColor(lastRequest?.status);

        return (
            <List.Item
                title={item.connected_user?.full_name || 'Usuário sem nome'}
                description={statusText}
                left={props => <Avatar.Icon {...props} icon="account" style={{ backgroundColor: statusColor }} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
            />
        )
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Meus Conectados" />
                <Appbar.Action icon="logout" onPress={() => signOut()} />
            </Appbar.Header>

            {isLoading && connections.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : connections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="bodyLarge" style={styles.emptyText}>
                        Você ainda não monitora ninguém.
                    </Text>
                    <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#666' }}>
                        Toque no + para adicionar alguém pelo email.
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
            />

            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>Adicionar Conectado</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{ marginBottom: 10 }}>Digite o email da pessoa que você quer monitorar. Ela deve ter uma conta no app.</Text>
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
                        <Button onPress={handleAddConnection} loading={adding} disabled={adding}>Adicionar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
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
    listItem: {
        backgroundColor: 'white',
        marginBottom: 8,
        borderRadius: 8,
        elevation: 2,
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
    }
});
