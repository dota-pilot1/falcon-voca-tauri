export type VocabularyMarker = "ELEMENTARY_RECOMMENDED" | "COMMON_RECOMMENDED" | "ADVANCED_RECOMMENDED";

export type VocabularyQuizChoice = {
  meaningKo: string;
  correct: boolean;
};

export type VocabularyQuizQuestion = {
  vocabularyId: string;
  headword: string;
  choices: VocabularyQuizChoice[];
};
