import * as Location from "expo-location";
import { Link, router, Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Chip } from "@/components/Chip";
import { DemoBanner } from "@/components/DemoBanner";
import { ResultCard } from "@/components/ResultCard";
import { AREAS, DEFAULT_ORIGIN } from "@/lib/areas";
import { searchStock } from "@/lib/search";
import { colors, radius } from "@/lib/theme";
import type { LatLng, SearchFilters, SearchResponse, SortMode } from "@/lib/types";
import { useDebounced } from "@/lib/useDebounced";

const SUGGESTIONS = ["panadol", "amoxcilin", "coartem", "ORS", "septrin", "painkiller"];
const PRICES: { label: string; value: number | null }[] = [
  { label: "Any price", value: null },
  { label: "≤ 5k", value: 5000 },
  { label: "≤ 10k", value: 10000 },
  { label: "≤ 20k", value: 20000 },
];

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState<LatLng>(DEFAULT_ORIGIN);
  const [place, setPlace] = useState("Nakawa");
  const [radiusKm, setRadiusKm] = useState(5);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [openNow, setOpenNow] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortMode>("distance");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebounced(q, 200);
  const filters: SearchFilters = useMemo(
    () => ({ q: debouncedQ, origin, radiusKm, inStockOnly, openNow, maxPrice, sort }),
    [debouncedQ, origin, radiusKm, inStockOnly, openNow, maxPrice, sort],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    searchStock(filters, ctrl.signal)
      .then(setData)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError("Could not reach the search service. Check that the Stock API is running and your phone is on the same Wi-Fi.");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [filters]);

  async function useMyLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied. Pick an area instead.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setOrigin([pos.coords.latitude, pos.coords.longitude]);
      setPlace("My location");
    } catch {
      setError("Could not get your location. Pick an area instead.");
    }
  }

  const header = (
    <View>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find your medicine nearby</Text>
        <Text style={styles.heroSub}>Which pharmacy has it in stock, and what it costs, before you leave home.</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search a medicine, e.g. panadol or amoxcilin"
          placeholderTextColor={colors.muted}
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search medicines"
          testID="search-input"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => setQ(s)} style={styles.suggestion}>
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.label}>Near</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="📍 My location" active={place === "My location"} onPress={useMyLocation} />
        {AREAS.map((a) => (
          <Chip key={a.name} label={a.name} active={place === a.name} onPress={() => { setOrigin(a.location); setPlace(a.name); }} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Filters</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Nearest" active={sort === "distance"} onPress={() => setSort("distance")} />
        <Chip label="Cheapest" active={sort === "price"} onPress={() => setSort("price")} />
        <Chip label="In stock" active={inStockOnly} onPress={() => setInStockOnly(!inStockOnly)} />
        <Chip label="Open now" active={openNow} onPress={() => setOpenNow(!openNow)} />
        {[2, 5, 10].map((r) => (
          <Chip key={r} label={`${r} km`} active={radiusKm === r} onPress={() => setRadiusKm(r)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PRICES.map((p) => (
          <Chip key={p.label} label={p.label} active={maxPrice === p.value} onPress={() => setMaxPrice(p.value)} />
        ))}
      </ScrollView>

      <View style={styles.statusRow}>
        <Text style={styles.status}>
          {data ? `${data.found} result${data.found === 1 ? "" : "s"} within ${radiusKm} km of ${place}` : " "}
          {data?.search_time_ms !== undefined ? ` · ${data.search_time_ms} ms` : ""}
        </Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Link href="/pharmacist" style={styles.headerLink}>Pharmacy</Link>
              <Link href="/about" style={styles.headerLink}>About</Link>
            </View>
          ),
        }}
      />
      <DemoBanner />
      <FlatList
        data={data?.hits ?? []}
        keyExtractor={(h) => h.document.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ResultCard
            hit={item}
            onOpen={(id) => router.push({ pathname: "/pharmacy/[id]", params: { id, lat: String(origin[0]), lng: String(origin[1]) } })}
            onAlternatives={(medicineId) =>
              router.push({ pathname: "/alternatives/[medicineId]", params: { medicineId, lat: String(origin[0]), lng: String(origin[1]) } })
            }
          />
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing found nearby</Text>
              <Text style={styles.emptyText}>Try a bigger radius, turn off Open now, or check the spelling. Ask your pharmacist about alternatives.</Text>
            </View>
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, padding: 16, paddingTop: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  heroSub: { color: "#D1FAE5", fontSize: 13, marginTop: 4, marginBottom: 12 },
  search: { backgroundColor: "#fff", borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text },
  suggestion: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  suggestionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginTop: 14, marginLeft: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  chips: { paddingHorizontal: 16, paddingTop: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginTop: 14, marginBottom: 8, minHeight: 22 },
  status: { color: colors.muted, fontSize: 13 },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, marginHorizontal: 16, padding: 10, borderRadius: radius.md, marginBottom: 8 },
  empty: { alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 6 },
  headerLink: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
