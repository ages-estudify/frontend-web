import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

import { ExamFormSheet } from '@/components/exams/ExamFormSheet';
import { ExamImportReviewSheet } from '@/components/exams/ExamImportReviewSheet';
import {
  buildExamReviewItems,
  parseExamCsvContent,
  readFileAsText,
  type ExamReviewItem,
} from '@/components/exams/exam-import.utils';
import { ExamCard, type ExamCardQuestion } from '@/components/examsCards';
import { Title } from '@/components/title';
import { Input } from '@/components/ui/input';
import { deleteExam, getExams, importExam, updateExam } from '@/services/exam.service';
import { getQuestionsByMockExamId, linkUnlinkedQuestionsToExam } from '@/services/question.service';
import type { ExamFormData, ExamListItem } from '@/types/exam.types';
import { formatApiError } from '@/utils/api-error';

function buildExamMetadata(exam: ExamListItem): string[] {
  const dayLabels = exam.days.length > 0 ? exam.days.map((d) => `Dia ${d.day}`) : ['Dia 1'];

  return [`${exam.totalQuestions} questões`, exam.origin, ...dayLabels];
}

export function ExamsPage() {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');

  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedExam, setSelectedExam] = useState<ExamListItem | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<Partial<ExamFormData>>({});
  const [submitError, setSubmitError] = useState('');

  const [examQuestionsById, setExamQuestionsById] = useState<Record<string, ExamCardQuestion[]>>(
    {}
  );
  const [loadingQuestionsExamId, setLoadingQuestionsExamId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [reviewItems, setReviewItems] = useState<ExamReviewItem[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const loadExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getExams();
      setExams(data);
    } catch (error) {
      console.error('Erro ao carregar simulados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const originOptions = useMemo(() => {
    const origins = exams.map((exam) => exam.origin);
    return Array.from(new Set(origins)).sort((a, b) => a.localeCompare(b));
  }, [exams]);

  const filteredExams = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return exams.filter((exam) => {
      const matchesSearch = !searchValue || exam.title.toLowerCase().includes(searchValue);

      const matchesOrigin = !selectedOrigin || exam.origin === selectedOrigin;

      return matchesSearch && matchesOrigin;
    });
  }, [exams, search, selectedOrigin]);

  const handleOpenCreateSheet = () => {
    setFormMode('create');
    setSelectedExam(null);
    setFormInitialValues({});
    setSubmitError('');
    setIsFormSheetOpen(true);
  };

  const handleOpenEditExam = (exam: ExamListItem) => {
    setFormMode('edit');
    setSelectedExam(exam);
    setFormInitialValues({
      name: exam.title,
      origin: exam.origin,
      day: String(exam.days[0]?.day ?? '1'),
      imageUrl: exam.imageUrl ?? null,
      imageFile: null,
      documentFile: null,
    });
    setSubmitError('');
    setIsFormSheetOpen(true);
  };

  const handleSubmitForm = async (data: ExamFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');

      if (formMode === 'create') {
        if (!data.documentFile) return;

        const csvContent = await readFileAsText(data.documentFile);
        const csvRows = parseExamCsvContent(csvContent);

        const importResult = await importExam(data.documentFile);
        const { examId, importedQuestions, failed, errors } = importResult.data;

        if (importedQuestions === 0) {
          const detail =
            errors.length > 0
              ? errors.map((e) => `Linha ${e.line}: ${e.error}`).join(' ')
              : 'Nenhuma questão foi importada. Confira discipline (matéria) e content (trilha).';

          setSubmitError(
            failed > 0
              ? `Importação concluída sem questões (${failed} linha(s) inválida(s)). ${detail}`
              : detail
          );
          return;
        }

        await linkUnlinkedQuestionsToExam(examId, importedQuestions);

        if (data.imageFile) {
          await updateExam(examId, { image: data.imageFile });
        }

        const importedQuestionList = await getQuestionsByMockExamId(examId, {
          expectedCount: importedQuestions,
        });

        const items = buildExamReviewItems(csvRows, errors, importedQuestionList);

        setReviewItems(items);
        setIsFormSheetOpen(false);
        setSelectedExam(null);
        setFormInitialValues({});
        setExamQuestionsById({});
        setIsReviewOpen(true);
        return;
      }

      if (selectedExam) {
        await updateExam(selectedExam.id, {
          title: data.name,
          origin: data.origin,
          image: data.imageFile,
        });
      }

      setIsFormSheetOpen(false);
      setSelectedExam(null);
      setFormInitialValues({});
      setExamQuestionsById({});
      await loadExams();
    } catch (error) {
      setSubmitError(
        formatApiError(
          error,
          'Não foi possível importar o simulado. Verifique o CSV (colunas, disciplina/conteúdo no sistema).'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishReview = async () => {
    setIsReviewOpen(false);
    setReviewItems([]);
    await loadExams();
  };

  const handleCloseReview = () => {
    setIsReviewOpen(false);
    setReviewItems([]);
    void loadExams();
  };

  const loadExamQuestions = useCallback(async (exam: ExamListItem) => {
    try {
      setLoadingQuestionsExamId(exam.id);
      const questions = await getQuestionsByMockExamId(exam.id, {
        expectedCount: exam.totalQuestions,
      });

      setExamQuestionsById((current) => ({
        ...current,
        [exam.id]: questions.map((question) => ({
          id: question.id,
          title: question.question,
        })),
      }));
    } catch (error) {
      console.error('Erro ao carregar questões do simulado:', error);
      setExamQuestionsById((current) => ({
        ...current,
        [exam.id]: [],
      }));
    } finally {
      setLoadingQuestionsExamId(null);
    }
  }, []);

  const handleExpandChange = (exam: ExamListItem, expanded: boolean) => {
    if (expanded && !examQuestionsById[exam.id]) {
      void loadExamQuestions(exam);
    }
  };

  const handleDeleteExam = async (exam: ExamListItem) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir o simulado "${exam.title}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setDeletingExamId(exam.id);
      setDeleteError('');

      await deleteExam(exam.id);

      setExams((current) => current.filter((item) => item.id !== exam.id));
      setExamQuestionsById((current) => {
        const next = { ...current };
        delete next[exam.id];
        return next;
      });
    } catch (error) {
      setDeleteError(
        formatApiError(error, 'Não foi possível excluir o simulado. Tente novamente.')
      );
    } finally {
      setDeletingExamId(null);
    }
  };

  return (
    <>
      <Title
        title="Gestão de Simulados"
        subtitle="Organize as trilhas de aprendizado e a ordem das questões"
        action={
          <button
            type="button"
            onClick={handleOpenCreateSheet}
            className="h-[36px] w-[143px] shrink-0 rounded-[8px] bg-[#9810FA] text-[14px] text-[#FFFFFF]"
          >
            + Novo Simulado
          </button>
        }
      />

      <div className="mt-8 flex flex-col gap-4">
        {deleteError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        <div className="flex flex-row items-center justify-between">
          <div className="h-[36px] w-[565px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar simulados..."
                className="h-[36px] rounded-[8px] border border-[#E5E7EB] bg-white pl-10"
              />
            </div>
          </div>

          <div className="relative h-[36px] w-[167px]">
            <select
              value={selectedOrigin}
              onChange={(event) => setSelectedOrigin(event.target.value)}
              className="h-[36px] w-full appearance-none rounded-[8px] border border-[#E5E7EB] bg-white px-4 pr-10 text-[14px] text-[#0A0A0A] outline-none"
              disabled={isLoading}
            >
              <option value="">Todas as origens</option>
              {originOptions.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              aria-hidden
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Carregando simulados...</p>
        ) : filteredExams.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum simulado encontrado.</p>
        ) : (
          filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              logoSrc={exam.imageUrl ?? '/enem-logo.svg'}
              logoAlt={`Logo ${exam.origin}`}
              title={exam.title}
              metadata={buildExamMetadata(exam)}
              questions={examQuestionsById[exam.id] ?? []}
              isLoadingQuestions={loadingQuestionsExamId === exam.id}
              isDeleting={deletingExamId === exam.id}
              labels={{
                expand: 'Expandir',
                collapse: 'Recolher',
                questionsTitle: 'Questões neste simulado:',
                editAriaLabel: 'Editar simulado',
                deleteAriaLabel: 'Excluir simulado',
              }}
              onExpandChange={(expanded) => handleExpandChange(exam, expanded)}
              onEdit={() => handleOpenEditExam(exam)}
              onDelete={() => handleDeleteExam(exam)}
            />
          ))
        )}
      </div>

      <ExamFormSheet
        key={formMode === 'edit' ? (selectedExam?.id ?? 'edit') : 'create'}
        open={isFormSheetOpen}
        onOpenChange={setIsFormSheetOpen}
        mode={formMode}
        initialValues={formInitialValues}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmitForm}
      />

      <ExamImportReviewSheet
        open={isReviewOpen}
        items={reviewItems}
        onClose={handleCloseReview}
        onFinish={handleFinishReview}
      />
    </>
  );
}
