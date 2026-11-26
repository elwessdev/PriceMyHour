import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '@/components/TabIcon';
import { useTheme } from '@/constants/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        // Taller than the default 49pt so the boxed icons leave room for a full-height label.
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.cardBorder,
          height: 58 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calculator',
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="$/h" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="estimator"
        options={{
          title: 'Project',
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="∑" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="presets"
        options={{
          title: 'Presets',
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="★" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, focused }) => <TabIcon glyph="i" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
