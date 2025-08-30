// RAE API response (based on provided example)
export interface RaeWordResponse {
  data: RaeWordData;
  ok: boolean;
}

export interface RaeWordData {
  word: string;
  meanings: RaeMeaning[];
}

export interface RaeMeaning {
  origin?: RaeOrigin | null;
  senses: RaeSense[];
  conjugations?: RaeConjugations | null;
}

export interface RaeOrigin {
  raw: string; // e.g., "Del lat. rodĕre."
  type?: string; // e.g., "lat"
  voice?: string;
  text?: string; // e.g., "rodĕre"
}

export interface RaeSense {
  raw?: string;
  meaning_number?: number;
  category?: string; // e.g., "verb"
  verb_category?: string; // e.g., "transitive"
  usage?: string;
  description?: string;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  // Some upstream payloads may include example sentences
  examples?: string[] | null;
}

export interface RaeConjugations {
  non_personal?: RaeNonPersonal;
  indicative?: RaeMoodTenses;
  subjunctive?: RaeMoodTenses;
  imperative?: Record<string, string> | RaeConjTable;
  [key: string]: unknown;
}

export interface RaeNonPersonal {
  infinitive?: string;
  participle?: string;
  gerund?: string;
  compound_infinitive?: string;
  compound_gerund?: string;
}

export interface RaeMoodTenses {
  present?: RaeConjTable;
  present_perfect?: RaeConjTable;
  imperfect?: RaeConjTable;
  past_perfect?: RaeConjTable;
  preterite?: RaeConjTable;
  past_anterior?: RaeConjTable;
  future?: RaeConjTable;
  future_perfect?: RaeConjTable;
  conditional?: RaeConjTable;
  conditional_perfect?: RaeConjTable;
  [key: string]: RaeConjTable | undefined;
}

export interface RaeConjTable {
  singular_first_person?: string;
  singular_second_person?: string;
  singular_formal_second_person?: string;
  singular_third_person?: string;
  plural_first_person?: string;
  plural_second_person?: string;
  plural_formal_second_person?: string;
  plural_third_person?: string;
  [key: string]: string | undefined;
}

// Simplified DTO our app uses
export interface DictSenseDTO {
  text: string;
  synonyms: string[];
  examples?: string[];
}

export interface DictEntryDTO {
  word: string;
  senses: DictSenseDTO[];
  etymology?: string | null;
  conjugations?: {
    non_personal?: RaeNonPersonal;
    indicative?: { present?: RaeConjTable; preterite?: RaeConjTable };
    subjunctive?: { present?: RaeConjTable };
    imperative?: Record<string, string> | RaeConjTable;
  } | null;
}
