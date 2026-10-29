import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Chip } from "@/components/Chip";
import { DemoBanner } from "@/components/DemoBanner";
import { StockRow } from "@/components/StockRow";
import { api } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import type { Pharmacy, PharmacyDetail } from "@/lib/types";

export default function PharmacistScreen() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pharmacyId, setPharmacyId] = useState("ph01");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<{ id: string; code: string } | null>(null);
  const [detail, setDetail] = useState<PharmacyDetail | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.pharmacies().then(setPharmacies).catch(() => setError("Could not reach the Stock API."));
  }, []);

  async function login() {
    setError(null);
    try {
      await api.login(pharmacyId, code);
      setSession({ id: pharmacyId, code });
      setDetail(await api.pharmacy(pharmacyId));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return (detail?.stock ?? []).filter((r) => !f || (r.medicine?.name ?? "").toLowerCase().includes(f));
  }, [detail, filter]);

  if (!session) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <DemoBanner />
        <View style={styles.card}>
          <Text style={styles.title}>Sign in as a pharmacy</Text>
          <Text style={styles.muted}>Update what is in stock and your prices. Customers see changes on their next search.</Text>
          <Text style={styles.label}>Pharmacy</Text>
          <View style={styles.wrap}>
            {pharmacies.map((p) => (
              <View key={p.id} style={{ marginBottom: 8 }}>
                <Chip label={p.area} active={pharmacyId === p.id} onPress={() => setPharmacyId(p.id)} />
              </View>
            ))}
          </View>
          <Text style={styles.label}>Pharmacy code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Demo code (see README)"
            placeholderTextColor={colors.muted}
            secureTextEntry
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel="Pharmacy code"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" style={styles.button} onPress={login}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (!detail) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  return (
    <View style={{ flex: 1 }}>
      <DemoBanner />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.medicine_id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            <Text style={styles.title}>{detail.name}</Text>
            <Text style={styles.muted}>Toggle stock or edit a price, then tap Save.</Text>
            <TextInput value={filter} onChangeText={setFilter} placeholder="Filter my medicines" placeholderTextColor={colors.muted} style={[styles.input, { marginTop: 12 }]} />
          </View>
        }
        renderItem={({ item }) => (
          <StockRow
            row={item}
            onSave={async (change) => {
              await api.updateStock(session.id, item.medicine_id, session.code, change);
              setDetail(await api.pharmacy(session.id));
            }}
          />
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, margin: 16, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  muted: { color: colors.muted, marginTop: 4, fontSize: 13 },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginTop: 16, marginBottom: 8, textTransform: "uppercase" },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: "#fff" },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  error: { color: colors.danger, marginTop: 10 },
});
