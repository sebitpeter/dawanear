import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

export function DemoBanner() {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>DEMO DATA · fictional pharmacies and prices · not medical advice</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.warnSoft, paddingVertical: 6, paddingHorizontal: 12 },
  text: { color: colors.warn, fontSize: 12, fontWeight: "600", textAlign: "center" },
});
