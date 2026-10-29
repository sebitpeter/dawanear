import { alternativeSections, safetyNote } from "../src/lib/alternatives";
import { alternativesPath } from "../src/lib/api";
import type { AlternativesResponse } from "../src/lib/types";

const empty = { found: 0, hits: [] };
const response: AlternativesResponse = {
  medicine: { id: "amox-500-cap", name: "Amoxicillin 500 mg capsules", generic_name: "amoxicillin", active_ingredients: ["amoxicillin"], category: "antibiotic", rx_only: true },
  same_ingredient: empty,
  same_class: empty,
};

describe("alternatives helpers", () => {
  it("builds the API path with location and sort", () => {
    expect(alternativesPath("amox-500-cap", [0.33, 32.615], "price")).toBe("/alternatives/amox-500-cap?sort=price&lat=0.33&lng=32.615");
    expect(alternativesPath("para-500-tab")).toBe("/alternatives/para-500-tab?sort=distance");
  });

  it("makes two sections: same ingredient first, then same class", () => {
    const s = alternativeSections(response);
    expect(s.map((x) => x.key)).toEqual(["same_ingredient", "same_class"]);
    expect(s[0].title).toContain("amoxicillin");
    expect(s[1].title).toBe("Other antibiotic medicines");
  });

  it("points to a pharmacist, and warns more for prescription medicines", () => {
    expect(safetyNote(false)).toMatch(/pharmacist/);
    expect(safetyNote(true)).toMatch(/pharmacist/);
    expect(safetyNote(true)).toMatch(/prescriber/);
    expect(safetyNote(false)).not.toMatch(/prescriber/);
  });
});
