import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "@/lib/theme";

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { color: colors.text, fontSize: 13, fontWeight: "500" },
  activeLabel: { color: "#fff" },
});
