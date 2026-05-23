import { useState } from 'react';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';

export type ExamCardQuestion = {
  id: string;
  title: string;
};

type ExamCardLabels = {
  expand: string;
  collapse: string;
  questionsTitle: string;
  addQuestion: string;
  editAriaLabel: string;
  deleteAriaLabel: string;
  deleteQuestionAriaLabel: string;
};

type ExamCardProps = {
  logoSrc: string;
  logoAlt: string;

  title: string;
  metadata: string[];

  questions: ExamCardQuestion[];
  isLoadingQuestions?: boolean;
  isDeleting?: boolean;

  labels: ExamCardLabels;

  onEdit?: () => void;
  onDelete?: () => void;
  onExpandChange?: (expanded: boolean) => void;
  onAddQuestion?: () => void;
  onDeleteQuestion?: (questionId: string) => void;
};

export function ExamCard({
  logoSrc,
  logoAlt,
  title,
  metadata,
  questions,
  isLoadingQuestions = false,
  isDeleting = false,
  labels,
  onEdit,
  onDelete,
  onExpandChange,
  onAddQuestion,
  onDeleteQuestion,
}: ExamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleToggleExpanded() {
    setIsExpanded((currentValue) => {
      const nextValue = !currentValue;
      onExpandChange?.(nextValue);
      return nextValue;
    });
  }

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-row items-center gap-5">
          <img src={logoSrc} alt={logoAlt} className="h-16 w-20 object-contain" />

          <div className="gap-2">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>

            <p className="mt-2 text-sm text-slate-600">{metadata.join(' • ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleToggleExpanded}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
          >
            {isExpanded ? labels.collapse : labels.expand}
          </button>

          <button
            type="button"
            onClick={onEdit}
            aria-label={labels.editAriaLabel}
            className="text-slate-900 transition hover:text-slate-600"
          >
            <Pencil size={18} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={labels.deleteAriaLabel}
            className="text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h4 className="mb-4 text-sm font-semibold text-slate-700">{labels.questionsTitle}</h4>

          <div className="flex flex-col gap-3">
            {isLoadingQuestions ? (
              <p className="text-sm text-slate-500">Carregando questões...</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma questão neste simulado.</p>
            ) : null}

            {questions.map((question, index) => (
              <div
                key={question.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <GripVertical size={18} className="shrink-0 text-slate-400" />

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-semibold text-purple-600">
                    {index + 1}
                  </span>

                  <p className="truncate text-sm text-slate-800">{question.title}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteQuestion?.(question.id)}
                  aria-label={labels.deleteQuestionAriaLabel}
                  className="ml-4 shrink-0 text-red-500 transition hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={onAddQuestion}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              <Plus size={17} />
              {labels.addQuestion}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
