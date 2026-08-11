import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation';
import { COLORS } from './src/constants/colors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const TOAST_CONFIG = {
  success: ({ text1, text2 }) => (
    <View style={{ backgroundColor: COLORS.successLight, borderLeftWidth: 4, borderLeftColor: COLORS.success, borderRadius: 12, padding: 14, marginHorizontal: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
      <View style={{ flex: 1 }}>
        {text1 && <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.success }}>{text1}</Text>}
        {text2 && <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{text2}</Text>}
      </View>
    </View>
  ),
};

import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor={COLORS.secondary}
              translucent={Platform.OS === 'android'}
            />
            <AppNavigator />
            <Toast config={TOAST_CONFIG} />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
