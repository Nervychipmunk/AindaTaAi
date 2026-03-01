module.exports = {
    preset: 'jest-expo',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-modules-core|react-native-svg|@react-navigation)/)',
    ],
};
