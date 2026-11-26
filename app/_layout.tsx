import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider, useAppState } from '@/components/AppStateProvider';
import { useTheme } from '@/constants/theme';

// Keep the splash screen up until saved inputs are loaded, so the
// calculator never flashes default values.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function HydrationGate({ children }: { children: ReactNode }) {
  const { ready } = useAppState();
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  return ready ? children : null;
}

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <HydrationGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </HydrationGate>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
