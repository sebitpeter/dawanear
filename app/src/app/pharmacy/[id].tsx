import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButtons } from "@/components/ActionButtons";
import { Badge } from "@/components/Badge";
import { DemoBanner } from "@/components/DemoBanner";
import { api } from "@/lib/api";
import { formatUGX, hoursLabel, isOpenNow, timeAgo } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { PharmacyDetail } from "@/lib/types";

export default function PharmacyScreen() {
  const { id, lat, lng } = useLocalSearchParams<{ id: string; lat?: string; lng?: string }>();
  const [p, setP] = useState<PharmacyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.pharmacy(String(id)).then(setP).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!p) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  const stock = [...p.stock].sort((a, b) => Number(b.in_stock) - Number(a.in_stock));
  const open = isOpenNow(p);
  // Look for alternatives around the user if we know where they are, else around this pharmacy.
  const origin = lat && lng ? [Number(lat), Number(lng)] : p.location;
  const openAlternatives = (medicineId: string) =>
    router.push({ pathname: "/alternatives/[medicineId]", params: { medicineId, lat: String(origin[0]), lng: String(origin[1]) } });

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: p.area }} />
      <DemoBanner />
      <FlatList
        data={stock}
        keyExtractor={(s) => s.medicine_id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.meta}>{p.area}, Kampala · {hoursLabel(p)}</Text>
            <View style={styles.badges}>
              {open ? <Badge label="Open now" tone="ok" /> : <Badge label="Closed now" tone="warn" />}
              {p.open_24h ? <Badge label="24 hours" /> : null}
              <Badge label="Demo pharmacy" tone="warn" />
            </View>
            <Text style={styles.meta}>📞 {p.phone} (fictional demo number)</Text>
            <ActionButtons phone={p.phone} location={p.location} />
            <Text style={styles.section}>Medicines ({stock.filter((s) => s.in_stock).length} in stock)</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.med, !item.in_stock && { color: colors.muted }]}>{item.medicine?.name ?? item.medicine_id}</Text>
              <Text style={styles.small}>
                {item.in_stock ? "In stock" : "Out of stock"} · updated {timeAgo(item.updated_at)}
                {item.medicine?.rx_only ? " · Prescription required" : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.price, !item.in_stock && { color: colors.muted }]}>{formatUGX(item.price_ugx)}</Text>
              <Pressable accessibilityRole="link" onPress={() => openAlternatives(item.medicine_id)} testID={`alternatives-${item.medicine_id}`} hitSlop={8}>
                <Text style={styles.altLink}>{item.in_stock ? "Alternatives ›" : "Find alternatives ›"}</Text>
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.card, padding: 16, marginBottom: 8, borderBottomWidth: 1, borderColor: colors.border },
  name: { fontSize: 20, fontWeight: "800", color: colors.text },
  meta: { color: colors.muted, marginTop: 6, fontSize: 13 },
  badges: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  section: { marginTop: 20, fontSize: 12, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  med: { fontSize: 14, fontWeight: "600", color: colors.text },
  small: { fontSize: 12, color: colors.muted, marginTop: 2 },
  price: { fontWeight: "800", color: colors.primaryDark, marginLeft: 8 },
  altLink: { color: colors.primary, fontWeight: "700", fontSize: 12.5, marginTop: 6 },
  error: { color: colors.danger, padding: 16 },
});
