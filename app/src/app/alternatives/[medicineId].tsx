import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/Chip";
import { DemoBanner } from "@/components/DemoBanner";
import { ResultCard } from "@/components/ResultCard";
import { alternativeSections, safetyNote } from "@/lib/alternatives";
import { api } from "@/lib/api";
import { DEFAULT_ORIGIN } from "@/lib/areas";
import { colors, radius } from "@/lib/theme";
import type { AlternativesResponse, LatLng, SortMode } from "@/lib/types";

export default function AlternativesScreen() {
  const { medicineId, lat, lng } = useLocalSearchParams<{ medicineId: string; lat?: string; lng?: string }>();
  const origin: LatLng = lat && lng ? [Number(lat), Number(lng)] : DEFAULT_ORIGIN;
  const [sort, setSort] = useState<SortMode>("distance");
  const [data, setData] = useState<AlternativesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    api
      .alternatives(String(medicineId), origin, sort)
      .then((r) => live && setData(r))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
    // origin comes from route params, so its parts are stable strings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicineId, lat, lng, sort]);

  if (error) return <Text style={styles.error}>Could not load alternatives: {error}</Text>;
  if (!data) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  const sections = alternativeSections(data);
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Alternatives" }} />
      <DemoBanner />
      <SectionList
        sections={sections}
        keyExtractor={(h) => h.document.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.label}>Alternatives to</Text>
            <Text style={styles.name}>{data.medicine.name}</Text>
            <View style={styles.note} accessibilityRole="alert" testID="safety-note">
              <Text style={styles.noteTitle}>⚕️ Ask a pharmacist before switching</Text>
              <Text style={styles.noteText}>{safetyNote(data.medicine.rx_only)}</Text>
            </View>
            <View style={styles.sortRow}>
              <Chip label="Nearest" active={sort === "distance"} onPress={() => setSort("distance")} />
              <Chip label="Cheapest" active={sort === "price"} onPress={() => setSort("price")} />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>
              {section.title} · {section.data.length}
            </Text>
            <Text style={styles.sectionSub}>{section.subtitle}</Text>
          </View>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? <Text style={styles.empty}>None in stock within 10 km.</Text> : null
        }
        renderItem={({ item }) => (
          <ResultCard hit={item} onOpen={(id) => router.push({ pathname: "/pharmacy/[id]", params: { id, lat: String(origin[0]), lng: String(origin[1]) } })} />
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 4 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 2 },
  note: { backgroundColor: colors.warnSoft, borderRadius: radius.md, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#FCD34D" },
  noteTitle: { fontWeight: "800", color: colors.warn, fontSize: 14 },
  noteText: { color: colors.text, marginTop: 4, fontSize: 13, lineHeight: 18 },
  sortRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  sectionHead: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  sectionSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  empty: { marginHorizontal: 16, color: colors.muted, fontStyle: "italic" },
  error: { color: colors.danger, padding: 16 },
});
