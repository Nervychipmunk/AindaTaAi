import { act } from '@testing-library/react-native';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';

// Mock Supabase methods types for clear assertions
const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

describe('authStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuthStore.setState({ session: null, user: null, profile: null, isLoading: false });
    });

    it('should initialize with session if present', async () => {
        const mockUser = { id: 'test-user', email: 'test@email.com' };
        const mockSession = { user: mockUser };

        mockGetSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });

        // Mock profile fetch
        mockFrom.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
                data: { id: 'test-user', role: 'hub', full_name: 'Tester' },
                error: null
            }),
        });

        await act(async () => {
            await useAuthStore.getState().initialize();
        });

        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockUser);
        expect(state.profile?.role).toBe('hub');
        expect(state.isLoading).toBe(false);
    });

    it('should sign out correctly', async () => {
        await act(async () => {
            await useAuthStore.getState().signOut();
        });

        expect(mockSignOut).toHaveBeenCalled();
        const state = useAuthStore.getState();
        expect(state.session).toBeNull();
        expect(state.profile).toBeNull();
    });
});
