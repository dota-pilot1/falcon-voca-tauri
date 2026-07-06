import { apiFetch } from "../../../shared/api/client";
import type { VocabularyItem, VocabularyMarker, VocabularyQuizQuestion } from "../model/types";

async function readErrorMessage(response: Response, fallback: string) {
  const text = await response.text().catch(() => "");
  if (!text) return fallback;
  try {
    const data = JSON.parse(text) as { message?: string };
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchVocabularyQuiz(
  apiUrl: string,
  token: string,
  options: { marker?: VocabularyMarker; count?: number } = {}
) {
  const params = new URLSearchParams();
  if (options.marker) params.set("marker", options.marker);
  params.set("count", String(options.count ?? 10));

  const response = await apiFetch(`${apiUrl}/api/vocabulary-play/quiz?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `단어 퀴즈를 불러오지 못했습니다 (HTTP ${response.status})`));
  }

  return (await response.json()) as VocabularyQuizQuestion[];
}

export async function fetchVocabularyWords(
  apiUrl: string,
  token: string,
  options: { marker?: VocabularyMarker; keyword?: string } = {}
) {
  const params = new URLSearchParams();
  if (options.marker) params.set("marker", options.marker);
  if (options.keyword?.trim()) params.set("keyword", options.keyword.trim());

  const suffix = params.toString();
  const response = await apiFetch(`${apiUrl}/api/vocabulary-play/words${suffix ? `?${suffix}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `단어장을 불러오지 못했습니다 (HTTP ${response.status})`));
  }

  return (await response.json()) as VocabularyItem[];
}
