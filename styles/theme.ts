import { StyleSheet } from 'react-native';

export const COLORS = {
    background: '#0D0D0E',
    surface: '#16161A',
    surfaceHover: '#22222A',

    accentOrange: '#FF9F0A',
    accentBlue: '#0A84FF',
    accentGreen: '#30D158',
    accentPurple: '#BF5AF2',

    textPrimary: '#F2F2F7',
    textSecondary: '#AEAEB2',
    textMuted: '#636366',

    border: 'rgba(255, 255, 255, 0.06)'
};

export const globalStyles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 16
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
        letterSpacing: -0.5
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,

        elevation: 3
    },

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background
    },

    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'lowercase'
    }
});