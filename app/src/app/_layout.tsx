import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { loadSavedApiUrl } from "@/lib/serverSetting";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  // Load a saved server address before the first search runs.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadSavedApiUrl().finally(() => setReady(true));
  }, []);
  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "DawaNear" }} />
        <Stack.Screen name="pharmacy/[id]" options={{ title: "Pharmacy" }} />
        <Stack.Screen name="alternatives/[medicineId]" options={{ title: "Alternatives" }} />
        <Stack.Screen name="pharmacist" options={{ title: "Pharmacy mode" }} />
        <Stack.Screen name="about" options={{ title: "About & safety" }} />
      </Stack>
    </>
  );
}
