import { useState } from 'react';
import { Pencil, Route, Trash2 } from 'lucide-react';

import type { TrailQuestion } from '@/types/trail.types';

type TrailCardLabels = {
  expand: string;
  collapse: string;
  questionsTitle: string;
  editAriaLabel: string;
  deleteAriaLabel: string;
};

type TrailCardProps = {
  iconUrl: string;
  iconAlt: string;
  title: string;
  description: string;
  metadata: string[];
  questions: TrailQuestion[];
  questionsLoaded?: boolean;
  questionsError?: string;
  isLoadingQuestions?: boolean;
  isDeleting?: boolean;
  labels: TrailCardLabels;
  onEdit?: () => void;
  onDelete?: () => void;
  onExpandChange?: (expanded: boolean) => void;
};

export function TrailCard({
  iconUrl,
  iconAlt,
  title,
  description,
  metadata,
  questions,
  questionsLoaded = false,
  questionsError,
  isLoadingQuestions = false,
  isDeleting = false,
  labels,
  onEdit,
  onDelete,
  onExpandChange,
}: TrailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = iconUrl.trim().length > 0 && !hasImageError;
  const questionsCountLabel = questionsLoaded
    ? `${questions.length} ${questions.length === 1 ? 'questão' : 'questões'}`
    : 'Questões: —';

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
        <div className="flex min-w-0 flex-row items-center gap-5">
          <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-50">
            {shouldShowImage ? (
              <img
                src={iconUrl}
                alt={iconAlt}
                className="h-full w-full object-contain"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <Route className="h-8 w-8 text-purple-600" strokeWidth={1.7} aria-hidden />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">{title}</h3>

            {description ? (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{description}</p>
            ) : null}

            <p className="mt-2 text-sm text-slate-600">
              {[...metadata, questionsCountLabel].join(' - ')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
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
            ) : questionsError ? (
              <p className="text-sm text-red-600">{questionsError}</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma questão nesta trilha.</p>
            ) : null}

            {questions.map((question, index) => (
              <div
                key={question.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-semibold text-purple-600">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-800">{question.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[question.discipline, question.content, question.year]
                        .filter(Boolean)
                        .join(' - ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
