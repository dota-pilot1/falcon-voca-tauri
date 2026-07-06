export type VocabularyMarker = "ELEMENTARY_RECOMMENDED" | "COMMON_RECOMMENDED" | "ADVANCED_RECOMMENDED";

export type VocabularyItem = {
  id: string;
  sortOrder: number;
  letter: string;
  headword: string;
  alternativeHeadwords: string[];
  marker: VocabularyMarker;
  markerSymbol: string;
  categoryLabel: string;
  rawEntry: string;
  meaningKo: string | null;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  curriculumVersion: string;
  sourceSection: string;
  active: boolean;
};

export type VocabularyQuizChoice = {
  meaningKo: string;
  correct: boolean;
};

export type VocabularyQuizQuestion = {
  vocabularyId: string;
  headword: string;
  choices: VocabularyQuizChoice[];
};
