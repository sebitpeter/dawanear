import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

type Tone = "ok" | "danger" | "warn" | "neutral";
const tones: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: colors.okSoft, fg: colors.ok },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  warn: { bg: colors.warnSoft, fg: colors.warn },
  neutral: { bg: colors.primarySoft, fg: colors.primaryDark },
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginTop: 4 },
  text: { fontSize: 11, fontWeight: "700" },
});
