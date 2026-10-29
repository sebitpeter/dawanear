import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatDistance, formatUGX, isOpenNow, timeAgo } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { SearchHit } from "@/lib/types";
import { ActionButtons } from "./ActionButtons";
import { Badge } from "./Badge";

export function ResultCard({
  hit,
  onOpen,
  onAlternatives,
}: {
  hit: SearchHit;
  onOpen: (pharmacyId: string) => void;
  onAlternatives?: (medicineId: string) => void;
}) {
  const d = hit.document;
  const distance = formatDistance(hit.geo_distance_meters?.location);
  const open = isOpenNow(d);
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(d.pharmacy_id)} style={styles.card} testID={`result-${d.id}`}>
      <View style={styles.top}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.medicine}>{d.medicine_name}</Text>
          <Text style={styles.sub}>
            {d.generic_name}
            {d.brand_names.length ? ` · ${d.brand_names.join(", ")}` : ""}
          </Text>
        </View>
        <Text style={styles.price}>{formatUGX(d.price_ugx)}</Text>
      </View>

      <View style={styles.pharmacyRow}>
        <Text style={styles.pharmacy} numberOfLines={1}>🏥 {d.pharmacy_name}</Text>
        {distance ? <Text style={styles.distance}>{distance}</Text> : null}
      </View>
      <Text style={styles.sub}>{d.area} · updated {timeAgo(d.updated_at)}</Text>

      <View style={styles.badges}>
        {d.in_stock ? <Badge label="In stock" tone="ok" /> : <Badge label="Out of stock" tone="danger" />}
        {open ? <Badge label={d.open_24h ? "Open 24h" : "Open now"} tone="ok" /> : <Badge label="Closed now" tone="warn" />}
        {d.rx_only ? <Badge label="Prescription required" tone="warn" /> : null}
      </View>

      <ActionButtons phone={d.phone} location={d.location} />
      {onAlternatives ? (
        <Pressable accessibilityRole="link" onPress={() => onAlternatives(d.medicine_id)} style={styles.altLink} testID={`alternatives-${d.medicine_id}`}>
          <Text style={styles.altText}>🔄 See alternatives nearby ›</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  top: { flexDirection: "row", alignItems: "flex-start" },
  medicine: { fontSize: 16, fontWeight: "700", color: colors.text },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "800", color: colors.primaryDark },
  pharmacyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  pharmacy: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },
  distance: { fontSize: 13, fontWeight: "700", color: colors.primary, marginLeft: 8 },
  badges: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  altLink: { marginTop: 10, paddingVertical: 4, alignSelf: "flex-start" },
  altText: { color: colors.primary, fontWeight: "700", fontSize: 13.5 },
});
