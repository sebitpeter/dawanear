import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import { ResultCard } from "../src/components/ResultCard";
import type { SearchHit } from "../src/lib/types";

const hit: SearchHit = {
  geo_distance_meters: { location: 1512 },
  document: {
    id: "ph10-amox-500-cap",
    medicine_id: "amox-500-cap",
    medicine_name: "Amoxicillin 500 mg capsules",
    generic_name: "amoxicillin",
    brand_names: ["Amoxil"],
    active_ingredients: ["amoxicillin"],
    strength: "500 mg",
    dosage_form: "capsule",
    category: "antibiotic",
    rx_only: true,
    pharmacy_id: "ph10",
    pharmacy_name: "Bugolobi Market Pharmacy (Demo)",
    area: "Bugolobi",
    phone: "+256700000110",
    location: [0.317, 32.619],
    price_ugx: 7000,
    in_stock: true,
    opens_min: 0,
    closes_min: 1440,
    open_24h: true,
    updated_at: Math.floor(Date.now() / 1000) - 7200,
    is_demo: true,
  },
};

describe("ResultCard", () => {
  it("shows medicine, pharmacy, price, distance and tags", async () => {
    await render(<ResultCard hit={hit} onOpen={() => {}} />);
    expect(screen.getByText("Amoxicillin 500 mg capsules")).toBeTruthy();
    expect(screen.getByText("UGX 7,000")).toBeTruthy();
    expect(screen.getByText("1.5 km")).toBeTruthy();
    expect(screen.getByText("In stock")).toBeTruthy();
    expect(screen.getByText("Prescription required")).toBeTruthy();
    expect(screen.getByText(/updated 2 h ago/)).toBeTruthy();
  });

  it("opens the pharmacy, the dialer and Google Maps", async () => {
    const onOpen = jest.fn();
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await render(<ResultCard hit={hit} onOpen={onOpen} />);
    await fireEvent.press(screen.getByText("Amoxicillin 500 mg capsules"));
    expect(onOpen).toHaveBeenCalledWith("ph10");
    await fireEvent.press(screen.getByText("📞 Call"));
    expect(openURL).toHaveBeenCalledWith("tel:+256700000110");
    await fireEvent.press(screen.getByText("🧭 Directions"));
    expect(openURL).toHaveBeenCalledWith("https://www.google.com/maps/dir/?api=1&destination=0.317,32.619");
  });

  it("links to alternatives only when asked", async () => {
    const onAlternatives = jest.fn();
    await render(<ResultCard hit={hit} onOpen={() => {}} />);
    expect(screen.queryByText(/See alternatives/)).toBeNull();
    await render(<ResultCard hit={hit} onOpen={() => {}} onAlternatives={onAlternatives} />);
    await fireEvent.press(screen.getByText("🔄 See alternatives nearby ›"));
    expect(onAlternatives).toHaveBeenCalledWith("amox-500-cap");
  });
});
