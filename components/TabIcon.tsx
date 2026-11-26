import { StyleSheet, Text, View, type ColorValue } from 'react-native';

interface TabIconProps {
  glyph: string;
  color: ColorValue;
  focused: boolean;
}

/** Tiny text-based tab icon, so no icon font dependency is needed. */
export function TabIcon({ glyph, color, focused }: TabIconProps) {
  return (
    <View style={[styles.box, { borderColor: color, backgroundColor: focused ? color : 'transparent' }]}>
      <Text style={[styles.glyph, { color: focused ? '#FFFFFF' : color }]} allowFontScaling={false}>
        {glyph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minWidth: 30,
    height: 24,
    paddingHorizontal: 4,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
  },
});
