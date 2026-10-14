import { StyleSheet, Text, View } from 'react-native';

interface Props {
  icon: string;
  background: string;
  size?: number;
  cornerRadius?: number;
  iconSize?: number;
  color?: string;
}

/** Quadrado arredondado com um ícone. É decorativo: o significado sempre vem em texto ao lado (RNF03). */
export function IconBox({ icon, background, size = 48, cornerRadius = 12, iconSize = 24, color }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width: size, height: size, borderRadius: cornerRadius, backgroundColor: background }]}
    >
      <Text style={{ fontSize: iconSize, color }}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
