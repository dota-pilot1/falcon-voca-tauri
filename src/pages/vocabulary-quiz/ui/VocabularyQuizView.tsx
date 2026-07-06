import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { fetchVocabularyQuiz } from "../../../entities/vocabulary/api/vocabularyApi";
import type { VocabularyMarker, VocabularyQuizQuestion } from "../../../entities/vocabulary/model/types";

const MARKER_OPTIONS: { value: VocabularyMarker | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "ELEMENTARY_RECOMMENDED", label: "초등 권장" },
  { value: "COMMON_RECOMMENDED", label: "중·고 공통" },
  { value: "ADVANCED_RECOMMENDED", label: "고등 선택/심화" },
];

const QUESTION_COUNT = 10;

export function VocabularyQuizView({ apiUrl, token }: { apiUrl: string; token: string }) {
  const [marker, setMarker] = useState<VocabularyMarker | "ALL">("ALL");
  const [quiz, setQuiz] = useState<VocabularyQuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const startQuiz = useCallback(
    async (nextMarker: VocabularyMarker | "ALL") => {
      setLoading(true);
      setError("");
      setIndex(0);
      setSelectedChoice(null);
      setCorrectCount(0);
      try {
        const questions = await fetchVocabularyQuiz(apiUrl, token, {
          marker: nextMarker === "ALL" ? undefined : nextMarker,
          count: QUESTION_COUNT,
        });
        setQuiz(questions);
      } catch (err) {
        setQuiz([]);
        setError(err instanceof Error ? err.message : "단어 퀴즈를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, token]
  );

  useEffect(() => {
    void startQuiz(marker);
    // 최초 진입 시 한 번만 로드한다. marker 변경은 select onChange가 직접 startQuiz를 호출한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = quiz[index];
  const finished = quiz.length > 0 && index >= quiz.length;

  const selectChoice = (choiceIndex: number) => {
    if (selectedChoice !== null || !question) return;
    setSelectedChoice(choiceIndex);
    if (question.choices[choiceIndex].correct) setCorrectCount((count) => count + 1);
  };

  const nextQuestion = () => {
    setSelectedChoice(null);
    setIndex((current) => current + 1);
  };

  return (
    <section className="falcon-view">
      <div className="falcon-inner">
        <header className="falcon-page-head">
          <div>
            <h1>단어 퀴즈</h1>
            <p>단어를 보고 알맞은 뜻을 4개 중에 고르세요.</p>
          </div>
          <Select
            ariaLabel="난이도"
            value={marker}
            options={MARKER_OPTIONS}
            onChange={(value) => {
              setMarker(value);
              void startQuiz(value);
            }}
            disabled={loading}
          />
        </header>

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-6 text-sm font-bold text-zinc-600">
            <Loader2 className="spin" size={18} /> 퀴즈를 불러오는 중...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
            <CircleAlert size={18} /> {error}
          </div>
        )}

        {!loading && !error && question && !finished && (
          <div className="mx-auto flex max-w-xl flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="text-xs font-bold text-zinc-500">
              {index + 1} / {quiz.length} · 맞은 개수 {correctCount}
            </div>
            <h2 className="text-3xl font-black text-zinc-900">{question.headword}</h2>
            <div className="grid gap-2.5">
              {question.choices.map((choice, choiceIndex) => {
                const isSelected = selectedChoice === choiceIndex;
                const revealed = selectedChoice !== null;
                const stateClass = !revealed
                  ? "border-zinc-200 bg-white hover:border-zinc-400"
                  : choice.correct
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                    : isSelected
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-zinc-200 bg-white text-zinc-400";
                return (
                  <button
                    key={choice.meaningKo}
                    type="button"
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors disabled:cursor-default ${stateClass}`}
                    onClick={() => selectChoice(choiceIndex)}
                    disabled={revealed}
                  >
                    {choice.meaningKo}
                  </button>
                );
              })}
            </div>
            {selectedChoice !== null && (
              <div className="flex justify-end">
                <Button type="button" onClick={nextQuestion}>
                  {index + 1 === quiz.length ? "결과 보기" : "다음 문제"}
                </Button>
              </div>
            )}
          </div>
        )}

        {!loading && !error && finished && (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <Sparkles size={28} className="text-amber-500" />
            <h2 className="text-2xl font-black text-zinc-900">
              {correctCount} / {quiz.length} 문제를 맞혔습니다
            </h2>
            <Button type="button" onClick={() => void startQuiz(marker)}>
              <RotateCcw size={16} /> 다시 풀기
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
