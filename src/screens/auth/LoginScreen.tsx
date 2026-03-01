import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
// import { useNavigation } from '@react-navigation/native'; // We'll add types later

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Erro no Login', error.message);
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Title style={styles.title}>AindaTaAi</Title>
            <View style={styles.form}>
                <TextInput
                    label="Email"
                    left={<TextInput.Icon icon="email" />}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                />
                <TextInput
                    label="Password"
                    left={<TextInput.Icon icon="lock" />}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    autoCapitalize="none"
                    style={styles.input}
                />
                <Button
                    mode="contained"
                    onPress={signInWithEmail}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                >
                    Entrar
                </Button>
                <Button
                    mode="text"
                    onPress={() => navigation.navigate('SignUp')}
                    style={styles.linkButton}
                    testID="signup-link"
                    accessibilityLabel="signup-link"
                >
                    Não tem conta? Cadastre-se
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
        color: '#6200ee',
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
    },
    linkButton: {
        marginTop: 16,
    },
});
