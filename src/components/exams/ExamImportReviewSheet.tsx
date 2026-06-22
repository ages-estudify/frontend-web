import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

import { QuestionFormSheet } from '@/components/questions/QuestionFormSheet';
import { initialQuestionFormState } from '@/components/questions/question-form.constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { colors } from '@/constants/colors';
import { getQuestionById, getQuestionPaths, updateQuestion } from '@/services/question.service';
import type {
  CreateQuestionPayload,
  Question,
  QuestionFormData,
  QuestionPath,
  UpdateQuestionPayload,
} from '@/types/question.types';

import { countByStatus, humanizeExamImportError, type ExamReviewItem } from './exam-import.utils';

type ExamImportReviewSheetProps = {
  open: boolean;
  items: ExamReviewItem[];
  onClose: () => void;
  onFinish: () => void;
};

function hexToRgba(hex: string, opacity: number) {
  const sanitized = hex.replace('#', '');
  const fullHex =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => char + char)
          .join('')
      : sanitized;

  const number = Number.parseInt(fullHex, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function questionToFormData(question: Question): QuestionFormData {
  return {
    path_id: question.path_id,
    exam_id: question.exam_id ?? '',
    text: question.text,
    feedback: question.feedback ?? '',
    image: question.image ?? '',
    number: question.number !== null ? String(question.number) : '',
    year: String(question.year),
    day: question.day !== null ? String(question.day) : '',
    language: question.language ?? '',
    origin: question.origin,
    enable: question.enable,
    alternativeA: question.alternatives.find((item) => item.letter === 'A')?.text ?? '',
    alternativeB: question.alternatives.find((item) => item.letter === 'B')?.text ?? '',
    alternativeC: question.alternatives.find((item) => item.letter === 'C')?.text ?? '',
    alternativeD: question.alternatives.find((item) => item.letter === 'D')?.text ?? '',
    alternativeE: question.alternatives.find((item) => item.letter === 'E')?.text ?? '',
    correctAlternative: question.alternatives.find((item) => item.is_correct)?.letter ?? 'A',
  };
}

function csvRowToFormData(item: ExamReviewItem, paths: QuestionPath[]): QuestionFormData {
  const row = item.csvRow;
  const matchedPath = paths.find(
    (path) => path.name === row.content && path.subject?.name === row.discipline
  );

  return {
    path_id: matchedPath?.id ?? '',
    exam_id: '',
    text: row.question,
    feedback: row.answer_explanation,
    image: '',
    number: '',
    year: row.year,
    day: row.exam_day,
    language: '',
    origin: 'ORIGINAL',
    enable: true,
    alternativeA: row.alternative_a,
    alternativeB: row.alternative_b,
    alternativeC: row.alternative_c,
    alternativeD: row.alternative_d,
    alternativeE: row.alternative_e,
    correctAlternative:
      (row.correct_answer.toUpperCase() as QuestionFormData['correctAlternative']) || 'A',
  };
}

export function ExamImportReviewSheet({
  open,
  items,
  onClose,
  onFinish,
}: ExamImportReviewSheetProps) {
  const [reviewItems, setReviewItems] = useState<ExamReviewItem[]>(items);
  const [paths, setPaths] = useState<QuestionPath[]>([]);
  const [editingItem, setEditingItem] = useState<ExamReviewItem | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(initialQuestionFormState);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    setReviewItems(items);
  }, [items]);

  useEffect(() => {
    if (!open) return;

    const loadPaths = async () => {
      try {
        const response = await getQuestionPaths();
        setPaths(response);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
      }
    };

    loadPaths();
  }, [open]);

  const counts = useMemo(() => countByStatus(reviewItems), [reviewItems]);

  const handleOpenCorrection = async (item: ExamReviewItem) => {
    setPageError('');
    setEditingItem(item);

    if (item.importedQuestionId) {
      try {
        const response = await getQuestionById(item.importedQuestionId);
        const question =
          response && typeof response === 'object' && 'data' in response
            ? (response as { data: Question }).data
            : (response as Question | null);

        if (question) {
          setFormData(questionToFormData(question));
          setIsFormOpen(true);
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar questão para edição:', error);
      }
    }

    setFormData(csvRowToFormData(item, paths));
    setIsFormOpen(true);
  };

  const handleSaveQuestion = async (payload: CreateQuestionPayload | UpdateQuestionPayload) => {
    if (!editingItem || !editingItem.importedQuestionId) return;

    try {
      setIsSavingQuestion(true);
      await updateQuestion(editingItem.importedQuestionId, payload as UpdateQuestionPayload);

      setReviewItems((previous) =>
        previous.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                status: 'success',
                error: undefined,
                title: payload.text || item.title,
              }
            : item
        )
      );

      setIsFormOpen(false);
      setEditingItem(null);
      setFormData(initialQuestionFormState);
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
      setPageError('Não foi possível salvar a questão.');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
        <SheetContent
          side="center"
          showCloseButton={false}
          className="!left-1/2 !top-1/2 !h-auto !max-h-[90vh] !w-[min(92vw,900px)] !max-w-[900px] !translate-x-[-50%] !translate-y-[-50%] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl"
        >
          <section className="flex max-h-[90vh] flex-col bg-white">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-[18px] font-bold leading-none text-gray-900">
                  Revisão de Importação
                </h2>
                <p className="mt-2 text-sm text-slate-500">Revise as questões importadas.</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar revisão"
                className="text-[#0F172A] transition hover:opacity-70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {pageError && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {pageError}
                </p>
              )}

              <div className="mb-6 flex flex-wrap gap-3">
                <ReviewCounter
                  label="Sucesso"
                  value={counts.successCount}
                  background={colors.greenCSV}
                  labelColor={colors.greenLabelCSV}
                />

                <ReviewCounter
                  label="Erro"
                  value={counts.errorCount}
                  background={colors.redCSV}
                  labelColor={colors.redLabelCSV}
                />
              </div>

              <div className="space-y-4">
                {reviewItems.map((item) => (
                  <ReviewCard key={item.id} item={item} onEdit={() => handleOpenCorrection(item)} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <Button
                type="button"
                onClick={onFinish}
                className="h-10 rounded-lg px-5 text-sm font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: colors.buttonQuestion }}
              >
                Concluído
              </Button>
            </div>
          </section>
        </SheetContent>
      </Sheet>

      <QuestionFormSheet
        open={isFormOpen}
        onOpenChange={(nextOpen) => {
          setIsFormOpen(nextOpen);
          if (!nextOpen) {
            setEditingItem(null);
            setFormData(initialQuestionFormState);
          }
        }}
        mode="edit"
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSavingQuestion}
        onSubmit={handleSaveQuestion}
      />
    </>
  );
}

type ReviewCounterProps = {
  label: string;
  value: number;
  background: string;
  labelColor: string;
};

function ReviewCounter({ label, value, background, labelColor }: ReviewCounterProps) {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-xl border px-4 py-2"
      style={{
        backgroundColor: background,
        borderColor: hexToRgba(labelColor, 0.3),
      }}
    >
      <span className="text-sm font-medium" style={{ color: labelColor }}>
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color: labelColor }}>
        {value}
      </span>
    </div>
  );
}

type ReviewCardProps = {
  item: ExamReviewItem;
  onEdit: () => void;
};

function ReviewCard({ item, onEdit }: ReviewCardProps) {
  const statusMap = {
    success: {
      background: colors.greenCSV,
      border: hexToRgba(colors.greenLabelCSV, 0.3),
      titleColor: '#0F172A',
      textColor: colors.greenLabelCSV,
      icon: <CheckCircle2 className="h-5 w-5" style={{ color: colors.greenLabelCSV }} />,
      message: undefined as string | undefined,
    },
    error: {
      background: colors.redCSV,
      border: hexToRgba(colors.redLabelCSV, 0.3),
      titleColor: '#0F172A',
      textColor: colors.redLabelCSV,
      icon: <AlertCircle className="h-5 w-5" style={{ color: colors.redLabelCSV }} />,
      message: `Linha ${item.rowNumber}: ${humanizeExamImportError(item.error)}`,
    },
  } as const;

  const current = statusMap[item.status];

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        backgroundColor: current.background,
        borderColor: current.border,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {current.icon}
            <p className="truncate text-[18px] font-semibold" style={{ color: current.titleColor }}>
              {item.title}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md border border-[#E5E7EB] bg-white/70 px-2 py-1 text-xs text-[#0F172A]">
              {item.subjectName}
            </span>
            <span className="rounded-md border border-[#E5E7EB] bg-white/70 px-2 py-1 text-xs text-[#0F172A]">
              {item.trailName}
            </span>
          </div>

          {current.message ? (
            <p className="mt-3 text-sm" style={{ color: current.textColor }}>
              {current.message}
            </p>
          ) : null}
        </div>

        {item.status === 'success' && item.importedQuestionId ? (
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            className="h-8 rounded-lg border-[#E5E7EB] bg-white px-3 text-sm text-[#0F172A]"
          >
            Editar Questão
          </Button>
        ) : null}
      </div>
    </div>
  );
}
