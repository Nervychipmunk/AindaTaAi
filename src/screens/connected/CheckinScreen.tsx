import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

export default function CheckinScreen() {
    const { signOut } = useAuthStore();

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Olá, Conectado!</Text>
            <Text variant="bodyMedium" style={styles.text}>
                (Em breve: Botão de Check-in)
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
