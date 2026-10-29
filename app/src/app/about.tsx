import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BUILT_IN_API_URL, config, isValidApiUrl, searchesDirectly } from "@/lib/config";
import { checkApi, saveApiUrl } from "@/lib/serverSetting";
import { colors, radius } from "@/lib/theme";

function ServerCard() {
  const [url, setUrl] = useState(config.apiUrl);
  const [status, setStatus] = useState<string | null>(null);

  const save = async () => {
    if (url.trim() && !isValidApiUrl(url)) return setStatus("That doesn't look like an address. Example: http://192.168.1.23:4000");
    const saved = await saveApiUrl(url);
    setUrl(saved);
    setStatus("Checking…");
    setStatus((await checkApi(saved)) ? `✅ Connected to ${saved}` : `⚠️ Saved, but ${saved} is not answering. Is the API running and on the same Wi-Fi?`);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Server (Stock API)</Text>
      <Text style={styles.body}>The laptop or server running the DawaNear Stock API. Built-in: {BUILT_IN_API_URL}</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://192.168.1.23:4000"
        placeholderTextColor={colors.muted}
        style={styles.input}
        accessibilityLabel="Server address"
      />
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <Pressable accessibilityRole="button" style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Save & test</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={[styles.button, styles.ghost]} onPress={() => { setUrl(""); saveApiUrl("").then(setUrl); setStatus("Back to the built-in address"); }}>
          <Text style={[styles.buttonText, { color: colors.primary }]}>Reset</Text>
        </Pressable>
      </View>
      {status ? <Text style={[styles.body, { marginTop: 8 }]}>{status}</Text> : null}
    </View>
  );
}

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <ServerCard />
      <View style={styles.card}>
        <Text style={styles.title}>Safety first</Text>
        <Text style={styles.body}>
          DawaNear shows where a medicine is available and what it costs. It is not medical advice and gives no dosage
          information. Always ask a pharmacist or health worker before taking or switching a medicine. Items marked
          “Prescription required” need a valid prescription.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Demo data</Text>
        <Text style={styles.body}>
          All pharmacies, phone numbers, stock levels and prices in this build are fictional demo data created for the
          droidcon Uganda 2026 hackathon. Medicine names come from the WHO Essential Medicines List.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>How it works</Text>
        <Text style={styles.body}>
          Search is powered by Typesense Cloud: typo tolerance (amoxcilin finds amoxicillin), brand-to-generic synonyms
          (panadol finds paracetamol), geo search sorted by distance, and filters for stock, opening hours and price.
          Pharmacies update stock through the DawaNear Stock API, which re-indexes Typesense instantly.
        </Text>
        <Text style={[styles.body, { marginTop: 8 }]}>Search mode: {searchesDirectly() ? "direct to Typesense (search-only key)" : "through the Stock API"}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Tools & AI used</Text>
        <Text style={styles.body}>Expo / React Native, Typesense Cloud, Node.js + Express. Built with help from an AI coding assistant (disclosed to the judges).</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 20, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, fontSize: 15, color: colors.text, backgroundColor: colors.bg },
  button: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md },
  ghost: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary },
  buttonText: { color: "#fff", fontWeight: "700" },
});
