import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_ICON } from '../constants/icons';
import { qualityColors } from '../theme/colors';
import { radius } from '../theme/tokens';
import type { Quality } from '../types';

interface Props {
  quality: Quality;
  big?: boolean;
}

export function QualityBadge({ quality, big = true }: Props) {
  const c = qualityColors[quality];
  const fontSize = big ? 18 : 14;
  return (
    <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ color: c.badgeFg, fontWeight: '700', fontSize }}
      >
        {QUALITY_ICON[quality]}
      </Text>
      <Text style={{ color: c.badgeFg, fontWeight: '700', fontSize, letterSpacing: 0.5 }}>{quality}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});
