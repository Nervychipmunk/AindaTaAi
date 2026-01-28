import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import DashboardHubScreen from '../screens/hub/DashboardHubScreen';
import CheckinScreen from '../screens/connected/CheckinScreen';

// Navigation Types
export type AuthStackParamList = {
    Login: undefined;
    SignUp: undefined;
};

export type AppStackParamList = {
    RoleSelection: undefined;
    DashboardHub: undefined;
    Checkin: undefined;
} & AuthStackParamList;

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
    const { session, profile } = useAuthStore();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!session ? (
                // Auth Stack
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                </>
            ) : !profile?.role ? (
                // Role Selection (Authenticated but no role)
                <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            ) : profile.role === 'hub' ? (
                // Hub Stack
                <Stack.Screen name="DashboardHub" component={DashboardHubScreen} />
            ) : (
                // Connected Stack
                <Stack.Screen name="Checkin" component={CheckinScreen} />
            )}
        </Stack.Navigator>
    );
}
