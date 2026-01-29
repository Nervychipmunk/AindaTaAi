import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            Alert.alert('Erro no Cadastro', error.message);
            setLoading(false);
        } else {
            // Auto-login after signup (workaround for email confirmation)
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) {
                // Auto-login failed (email confirmation required)
                // Navigate back to login screen
                navigation.navigate('Login');
            }
            // Success: Auth state will automatically update and navigate
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Criar Conta</Title>
            <View style={styles.form}>
                <TextInput
                    label="Nome Completo"
                    left={<TextInput.Icon icon="account" />}
                    onChangeText={(text) => setFullName(text)}
                    value={fullName}
                    style={styles.input}
                />
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
                    onPress={signUpWithEmail}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                >
                    Cadastrar
                </Button>
                <Button
                    mode="text"
                    onPress={() => navigation.goBack()}
                    style={styles.linkButton}
                >
                    Já tem conta? Entrar
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
        fontSize: 28,
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
