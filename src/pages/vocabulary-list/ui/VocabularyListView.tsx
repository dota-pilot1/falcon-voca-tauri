import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, CircleAlert, Loader2, Search } from "lucide-react";
import { fetchVocabularyWords } from "../../../entities/vocabulary/api/vocabularyApi";
import type { VocabularyItem, VocabularyMarker } from "../../../entities/vocabulary/model/types";
import { Select } from "../../../shared/ui/Select";

const MARKER_OPTIONS: { value: VocabularyMarker | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "ELEMENTARY_RECOMMENDED", label: "초등 권장" },
  { value: "COMMON_RECOMMENDED", label: "중·고 공통" },
  { value: "ADVANCED_RECOMMENDED", label: "고등 선택/심화" },
];

const markerTone: Record<VocabularyMarker, string> = {
  ELEMENTARY_RECOMMENDED: "emerald",
  COMMON_RECOMMENDED: "sky",
  ADVANCED_RECOMMENDED: "violet",
};

export function VocabularyListView({ apiUrl, token }: { apiUrl: string; token: string }) {
  const [marker, setMarker] = useState<VocabularyMarker | "ALL">("ALL");
  const [keyword, setKeyword] = useState("");
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadWords = useCallback(
    async (nextMarker: VocabularyMarker | "ALL", nextKeyword: string) => {
      setLoading(true);
      setError("");
      try {
        const items = await fetchVocabularyWords(apiUrl, token, {
          marker: nextMarker === "ALL" ? undefined : nextMarker,
          keyword: nextKeyword,
        });
        setWords(items);
        setSelectedId((current) => (current && items.some((item) => item.id === current) ? current : (items[0]?.id ?? null)));
      } catch (err) {
        setWords([]);
        setSelectedId(null);
        setError(err instanceof Error ? err.message : "단어장을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, token],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadWords(marker, keyword);
    }, 220);
    return () => window.clearTimeout(handle);
  }, [keyword, loadWords, marker]);

  const selectedWord = useMemo(
    () => words.find((item) => item.id === selectedId) ?? words[0] ?? null,
    [selectedId, words],
  );

  const counts = useMemo(() => {
    return words.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.marker] += 1;
        return acc;
      },
      {
        total: 0,
        ELEMENTARY_RECOMMENDED: 0,
        COMMON_RECOMMENDED: 0,
        ADVANCED_RECOMMENDED: 0,
      } satisfies Record<VocabularyMarker | "total", number>,
    );
  }, [words]);

  return (
    <section className="falcon-view">
      <div className="falcon-inner vocabulary-workspace">
        <header className="falcon-page-head">
          <div>
            <h1>단어장</h1>
            <p>교육과정 기본 어휘 3,000개를 검색하고 뜻, 품사, 예문을 확인합니다.</p>
          </div>
          <div className="vocabulary-toolbar">
            <label className="vocabulary-search">
              <Search size={17} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="단어, 뜻, 예문 검색"
              />
            </label>
            <Select
              ariaLabel="어휘 등급"
              value={marker}
              options={MARKER_OPTIONS}
              onChange={(value) => {
                setMarker(value);
                setSelectedId(null);
              }}
              disabled={loading}
            />
          </div>
        </header>

        <div className="vocabulary-summary">
          <SummaryCard label="조회 단어" value={`${counts.total.toLocaleString()}개`} />
          <SummaryCard label="초등 권장" value={`${counts.ELEMENTARY_RECOMMENDED.toLocaleString()}개`} />
          <SummaryCard label="중·고 공통" value={`${counts.COMMON_RECOMMENDED.toLocaleString()}개`} />
          <SummaryCard label="고등 선택/심화" value={`${counts.ADVANCED_RECOMMENDED.toLocaleString()}개`} />
        </div>

        {loading && (
          <div className="vocabulary-state">
            <Loader2 className="spin" size={18} /> 단어장을 불러오는 중...
          </div>
        )}

        {!loading && error && (
          <div className="vocabulary-state error">
            <CircleAlert size={18} /> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="vocabulary-layout">
            <div className="vocabulary-list" aria-label="단어 목록">
              {words.map((word) => (
                <button
                  type="button"
                  key={word.id}
                  className={selectedWord?.id === word.id ? "active" : ""}
                  onClick={() => setSelectedId(word.id)}
                >
                  <span className="word-rank">{word.sortOrder.toLocaleString()}</span>
                  <span className="word-main">
                    <strong>{word.headword}</strong>
                    <span>{word.meaningKo || word.rawEntry}</span>
                  </span>
                  <span className={`word-marker ${markerTone[word.marker]}`}>{word.categoryLabel}</span>
                </button>
              ))}
              {words.length === 0 && (
                <div className="vocabulary-empty">
                  <BookOpenText size={22} />
                  <strong>검색 결과가 없습니다.</strong>
                </div>
              )}
            </div>

            <aside className="vocabulary-detail">
              {selectedWord ? (
                <>
                  <div className="vocabulary-detail-head">
                    <span className={`word-marker ${markerTone[selectedWord.marker]}`}>{selectedWord.categoryLabel}</span>
                    <strong>#{selectedWord.sortOrder.toLocaleString()}</strong>
                  </div>
                  <h2>{selectedWord.headword}</h2>
                  {selectedWord.alternativeHeadwords.length > 0 && (
                    <p className="vocabulary-alt">{selectedWord.alternativeHeadwords.join(", ")}</p>
                  )}
                  <dl className="vocabulary-definition">
                    <div>
                      <dt>뜻</dt>
                      <dd>{selectedWord.meaningKo || selectedWord.rawEntry}</dd>
                    </div>
                    <div>
                      <dt>품사</dt>
                      <dd>{selectedWord.partOfSpeech || "-"}</dd>
                    </div>
                    <div>
                      <dt>예문</dt>
                      <dd>{selectedWord.exampleSentence || "-"}</dd>
                    </div>
                    <div>
                      <dt>해석</dt>
                      <dd>{selectedWord.exampleTranslation || "-"}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="vocabulary-empty detail">
                  <BookOpenText size={22} />
                  <strong>단어를 선택하세요.</strong>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="vocabulary-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
