import { fireEvent, render, screen } from "@testing-library/react-native";
import AlternativesScreen from "../src/app/alternatives/[medicineId]";
import { api } from "../src/lib/api";
import type { AlternativesResponse, StockDoc } from "../src/lib/types";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ medicineId: "amox-500-cap", lat: "0.33", lng: "32.615" }),
}));

const doc = (over: Partial<StockDoc>): StockDoc => ({
  id: "ph01-amox-250-syr", medicine_id: "amox-250-syr", medicine_name: "Amoxicillin 250 mg/5 ml suspension",
  generic_name: "amoxicillin", brand_names: ["Amoxil"], active_ingredients: ["amoxicillin"], strength: "250 mg/5 ml",
  dosage_form: "syrup", category: "antibiotic", rx_only: true, pharmacy_id: "ph01", pharmacy_name: "Nakawa Wellness Pharmacy (Demo)",
  area: "Nakawa", phone: "+256700000101", location: [0.33, 32.615], price_ugx: 6500, in_stock: true, opens_min: 480, closes_min: 1260,
  open_24h: false, updated_at: Math.floor(Date.now() / 1000), is_demo: true, ...over,
});

const response: AlternativesResponse = {
  medicine: { id: "amox-500-cap", name: "Amoxicillin 500 mg capsules", generic_name: "amoxicillin", active_ingredients: ["amoxicillin"], category: "antibiotic", rx_only: true },
  same_ingredient: { found: 1, hits: [{ document: doc({}), geo_distance_meters: { location: 130 } }] },
  same_class: { found: 0, hits: [] },
};

describe("Alternatives screen", () => {
  it("shows the safety note, both sections, and re-sorts by price", async () => {
    const spy = jest.spyOn(api, "alternatives").mockResolvedValue(response);
    await render(<AlternativesScreen />);
    expect(await screen.findByText("Amoxicillin 500 mg capsules")).toBeTruthy();
    expect(screen.getByText("⚕️ Ask a pharmacist before switching")).toBeTruthy();
    expect(screen.getByText(/only your doctor or prescriber/)).toBeTruthy();
    expect(screen.getByText("Amoxicillin 250 mg/5 ml suspension")).toBeTruthy();
    expect(screen.getByText(/Other antibiotic medicines · 0/)).toBeTruthy();
    expect(screen.getByText("None in stock within 10 km.")).toBeTruthy();
    expect(spy).toHaveBeenLastCalledWith("amox-500-cap", [0.33, 32.615], "distance");

    await fireEvent.press(screen.getByText("Cheapest"));
    expect(spy).toHaveBeenLastCalledWith("amox-500-cap", [0.33, 32.615], "price");

    await fireEvent.press(screen.getByText("Amoxicillin 250 mg/5 ml suspension"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/pharmacy/[id]", params: { id: "ph01", lat: "0.33", lng: "32.615" } });
  });

  it("shows an error if the API fails", async () => {
    jest.spyOn(api, "alternatives").mockRejectedValue(new Error("Network request failed"));
    await render(<AlternativesScreen />);
    expect(await screen.findByText(/Could not load alternatives: Network request failed/)).toBeTruthy();
  });
});
