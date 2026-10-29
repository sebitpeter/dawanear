import type { AlternativesResponse, SearchHit } from "./types";

export interface AlternativeSection {
  key: "same_ingredient" | "same_class";
  title: string;
  subtitle: string;
  data: SearchHit[];
}

/** Turns the API response into the two list sections the screen shows. */
export function alternativeSections(r: AlternativesResponse): AlternativeSection[] {
  const ingredients = r.medicine.active_ingredients.join(" + ");
  return [
    {
      key: "same_ingredient",
      title: `Same medicine, different form (${ingredients})`,
      subtitle: "Same active ingredient, e.g. syrup instead of tablets, or another strength or brand.",
      data: r.same_ingredient.hits,
    },
    {
      key: "same_class",
      title: `Other ${r.medicine.category} medicines`,
      subtitle: "Different active ingredient that treats similar problems. Not always a safe swap.",
      data: r.same_class.hits,
    },
  ];
}

/** Body of the "Ask a pharmacist before switching" note at the top of the screen. Stronger wording for prescription medicines. */
export function safetyNote(rxOnly: boolean): string {
  return rxOnly
    ? "This is a prescription medicine: only your doctor or prescriber can change it to another medicine. A pharmacist can tell you if another form or brand of the same medicine is OK."
    : "The right medicine, dose and form depend on age, weight, pregnancy and other medicines you take. A pharmacist can check this for you in a minute.";
}
