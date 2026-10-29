// Synonym set for Typesense (v30 synonym_sets API). Have a pharmacist confirm
// these and add local names used in Uganda.
export interface SynonymItem { id: string; synonyms: string[]; root?: string }

export const SYNONYM_SET = "medicine-synonyms";

export const synonymItems: SynonymItem[] = [
  { id: "paracetamol", synonyms: ["paracetamol", "acetaminophen", "panadol", "calpol"] },
  { id: "ibuprofen", synonyms: ["ibuprofen", "brufen", "advil"] },
  { id: "amoxicillin", synonyms: ["amoxicillin", "amoxil"] },
  { id: "metronidazole", synonyms: ["metronidazole", "flagyl"] },
  { id: "cotrimoxazole", synonyms: ["cotrimoxazole", "septrin", "bactrim"] },
  { id: "coartem", synonyms: ["artemether lumefantrine", "coartem"] },
  { id: "salbutamol", synonyms: ["salbutamol", "albuterol", "ventolin"] },
  { id: "chlorphenamine", synonyms: ["chlorphenamine", "chlorpheniramine", "piriton"] },
  { id: "buscopan", synonyms: ["hyoscine butylbromide", "buscopan"] },
  { id: "ors", synonyms: ["oral rehydration salts", "ors"] },
  { id: "augmentin", synonyms: ["augmentin", "amoxicillin clavulanate", "co-amoxiclav"] },
  { id: "painkiller", root: "painkiller", synonyms: ["paracetamol", "ibuprofen", "diclofenac"] },
  { id: "malaria", root: "malaria", synonyms: ["artemether lumefantrine", "quinine", "dihydroartemisinin piperaquine"] },
  { id: "dewormer", root: "dewormer", synonyms: ["albendazole"] },
];
