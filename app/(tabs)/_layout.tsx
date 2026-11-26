import { Tabs } from 'expo-router';

import { TabIcon } from '@/components/TabIcon';
import { useTheme } from '@/constants/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.cardBorder },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
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
