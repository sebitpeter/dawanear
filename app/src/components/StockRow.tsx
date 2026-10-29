import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { timeAgo } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { PharmacyStockRow } from "@/lib/types";

interface Props {
  row: PharmacyStockRow;
  onSave: (change: { in_stock: boolean; price_ugx: number }) => Promise<void>;
}

export function StockRow({ row, onSave }: Props) {
  const [inStock, setInStock] = useState(row.in_stock);
  const [price, setPrice] = useState(String(row.price_ugx));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const priceNum = Number(price);
  const valid = Number.isInteger(priceNum) && priceNum >= 0 && price.trim() !== "";
  const dirty = inStock !== row.in_stock || priceNum !== row.price_ugx;

  async function save() {
    if (!valid) return;
    setState("saving");
    try {
      await onSave({ in_stock: inStock, price_ugx: priceNum });
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <View style={styles.row} testID={`stock-${row.medicine_id}`}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{row.medicine?.name ?? row.medicine_id}</Text>
        <Text style={styles.small}>
          Updated {timeAgo(row.updated_at)}
          {state === "saved" ? " · Saved, customers see it now" : state === "error" ? " · Save failed, try again" : ""}
        </Text>
        <View style={styles.controls}>
          <Switch value={inStock} onValueChange={setInStock} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel="In stock" />
          <Text style={[styles.small, { marginLeft: 6, width: 80 }]}>{inStock ? "In stock" : "Out of stock"}</Text>
          <Text style={styles.small}>UGX</Text>
          <TextInput
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            style={[styles.input, !valid && { borderColor: colors.danger }]}
            accessibilityLabel="Price in shillings"
          />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!dirty || !valid || state === "saving"}
        onPress={save}
        style={[styles.save, (!dirty || !valid) && { opacity: 0.4 }]}
      >
        <Text style={styles.saveText}>{state === "saving" ? "…" : "Save"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  small: { fontSize: 12, color: colors.muted },
  controls: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6, minWidth: 80, fontSize: 14, color: colors.text },
  save: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, marginLeft: 8 },
  saveText: { color: "#fff", fontWeight: "700" },
});
