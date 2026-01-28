import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

export default function DashboardHubScreen() {
    const { signOut, user } = useAuthStore();

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Olá, Responsável!</Text>
            <Text variant="bodyMedium" style={styles.text}>
                (Em breve: Lista de conectados)
            </Text>
            <Button mode="contained" onPress={() => signOut()} style={styles.button}>
                Sair
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        marginVertical: 20,
    },
    button: {
        marginTop: 20
    }
});
