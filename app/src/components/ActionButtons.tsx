import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { directionsUrl } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { LatLng } from "@/lib/types";

export function ActionButtons({ phone, location }: { phone?: string; location: LatLng }) {
  return (
    <View style={styles.row}>
      {phone ? (
        <Pressable accessibilityRole="button" style={[styles.btn, styles.outline]} onPress={() => Linking.openURL(`tel:${phone}`)}>
          <Text style={[styles.label, { color: colors.primary }]}>📞 Call</Text>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" style={[styles.btn, styles.solid]} onPress={() => Linking.openURL(directionsUrl(location))}>
        <Text style={[styles.label, { color: "#fff" }]}>🧭 Directions</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: "center" },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.card },
  solid: { backgroundColor: colors.primary },
  label: { fontWeight: "700", fontSize: 14 },
});
