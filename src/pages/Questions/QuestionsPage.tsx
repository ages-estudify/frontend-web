import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { QuestionFormSheet } from '@/components/questions/QuestionFormSheet';
import { initialQuestionFormState } from '@/components/questions/question-form.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createQuestion,
  deleteQuestion,
  getQuestionPaths,
  getQuestions,
  updateQuestion,
} from '@/services/question.service';
import type {
  CreateQuestionPayload,
  Question,
  QuestionFormData,
  QuestionOrigin,
  QuestionPath,
  UpdateQuestionPayload,
} from '@/types/question.types';
import { Title } from '@/components/title';
import { formatApiError } from '@/utils/api-error';

const BACKEND_PAGE_SIZE = 100;
const UI_PAGE_SIZE = 20;

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paths, setPaths] = useState<QuestionPath[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(initialQuestionFormState);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [submitError, setSubmitError] = useState('');

  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true);

      const pathsResponse = await getQuestionPaths();

      setPaths(pathsResponse);
    } catch (error) {
      console.error('Erro ao carregar opções da página:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const loadAllQuestions = async () => {
    try {
      setIsLoading(true);

      const firstResponse = await getQuestions({
        page: 0,
        size: BACKEND_PAGE_SIZE,
      });

      const total = firstResponse.totalElements;
      const totalBackendPages = Math.ceil(total / BACKEND_PAGE_SIZE);

      let allQuestions = [...firstResponse.content];

      if (totalBackendPages > 1) {
        const remainingRequests = Array.from({ length: totalBackendPages - 1 }, (_, index) =>
          getQuestions({
            page: index + 1,
            size: BACKEND_PAGE_SIZE,
          })
        );

        const remainingResponses = await Promise.all(remainingRequests);

        remainingResponses.forEach((response) => {
          allQuestions = allQuestions.concat(response.content);
        });
      }

      const enabledQuestions = allQuestions.filter((question) => question.enable);

      setQuestions(enabledQuestions);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadAllQuestions();
  }, []);

  const getSubjectNameByPathId = useCallback(
    (pathId: string) => {
      const selectedPath = paths.find((path) => path.id === pathId);
      return selectedPath?.subject?.name ?? '-';
    },
    [paths]
  );

  const getQuestionOrder = (question: Question) => {
    if (question.number !== null && question.number !== undefined) {
      return question.number;
    }

    return question.path?.trail_position ?? '-';
  };

  const categoryOptions = useMemo(() => {
    const categories = paths.map((path) => path.subject?.name).filter(Boolean) as string[];
    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
  }, [paths]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const subjectName = question.path?.subject?.name ?? getSubjectNameByPathId(question.path_id);
      const searchValue = search.trim().toLowerCase();
      const questionText = (question.text ?? '').toLowerCase();

      const matchesSearch =
        !searchValue ||
        questionText.includes(searchValue) ||
        question.path?.name?.toLowerCase().includes(searchValue) ||
        subjectName.toLowerCase().includes(searchValue);

      const matchesCategory = !selectedCategory || subjectName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [questions, search, selectedCategory, getSubjectNameByPathId]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / UI_PAGE_SIZE));

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * UI_PAGE_SIZE;
    const endIndex = startIndex + UI_PAGE_SIZE;

    return filteredQuestions.slice(startIndex, endIndex);
  }, [filteredQuestions, currentPage]);

  const paginationLabel = useMemo(() => {
    if (filteredQuestions.length === 0) {
      return 'Mostrando questão 0–0 de 0';
    }

    const start = (currentPage - 1) * UI_PAGE_SIZE + 1;
    const end = Math.min(currentPage * UI_PAGE_SIZE, filteredQuestions.length);

    return `Mostrando questão ${start.toLocaleString('pt-BR')}–${end.toLocaleString(
      'pt-BR'
    )} de ${filteredQuestions.length.toLocaleString('pt-BR')}`;
  }, [currentPage, filteredQuestions.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const handleOpenCreateSheet = () => {
    setFormMode('create');
    setSelectedQuestion(null);
    setFormData(initialQuestionFormState);
    setSubmitError('');
    setIsFormSheetOpen(true);
  };

  const handleOpenEditSheet = (question: Question) => {
    const correctAlternative =
      question.alternatives?.find((alternative) => alternative.is_correct)?.letter ?? 'A';

    setFormMode('edit');
    setSelectedQuestion(question);
    setFormData({
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
      alternativeA: question.alternatives?.find((item) => item.letter === 'A')?.text ?? '',
      alternativeB: question.alternatives?.find((item) => item.letter === 'B')?.text ?? '',
      alternativeC: question.alternatives?.find((item) => item.letter === 'C')?.text ?? '',
      alternativeD: question.alternatives?.find((item) => item.letter === 'D')?.text ?? '',
      alternativeE: question.alternatives?.find((item) => item.letter === 'E')?.text ?? '',
      correctAlternative,
    });
    setIsFormSheetOpen(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    const confirmed = window.confirm('Deseja realmente excluir essa questão?');

    if (!confirmed) return;

    try {
      await deleteQuestion(id);
      await loadAllQuestions();
    } catch (error) {
      console.error('Erro ao excluir questão:', error);
    }
  };

  const handleSubmitForm = async (payload: CreateQuestionPayload | UpdateQuestionPayload) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');

      if (formMode === 'create') {
        await createQuestion(payload as CreateQuestionPayload);
      } else if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, payload as UpdateQuestionPayload);
      }

      setIsFormSheetOpen(false);
      setSelectedQuestion(null);
      setFormData(initialQuestionFormState);
      await loadAllQuestions();
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(formatApiError(error, 'Não foi possível salvar a questão.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <Title title="Gestão de Questões" subtitle="Gerencie todas as questões do Estudify" />

        <section className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar questões..."
                  className="h-12 rounded-xl border-[#E5E7EB] bg-[#F8FAFC] pl-10"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 min-w-[220px] rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 text-sm outline-none"
                disabled={isLoadingOptions}
              >
                <option value="">Todas as categorias</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              onClick={handleOpenCreateSheet}
              className="h-11 rounded-xl bg-[#A21CAF] px-5 text-white hover:bg-[#86198F]"
            >
              <Plus className="h-4 w-4" />
              Nova Questão
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    ID
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Questão
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Categoria
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Origem
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Trilha
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Ordem
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Imagem
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-[#64748B]">
                      Carregando questões...
                    </td>
                  </tr>
                ) : paginatedQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-[#64748B]">
                      Nenhuma questão encontrada.
                    </td>
                  </tr>
                ) : (
                  paginatedQuestions.map((question, index) => (
                    <tr key={question.id} className="border-b border-[#E5E7EB] last:border-b-0">
                      <td className="px-5 py-4 text-sm text-[#0F172A]">
                        #{(currentPage - 1) * UI_PAGE_SIZE + index + 1}
                      </td>

                      <td className="max-w-[360px] px-5 py-4 text-sm text-[#0F172A]">
                        <span className="line-clamp-2">{question.text}</span>
                      </td>

                      <td className="px-5 py-4">
                        <CategoryBadge
                          label={
                            question.path?.subject?.name ?? getSubjectNameByPathId(question.path_id)
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <OriginBadge origin={question.origin} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {question.path?.name ?? '-'}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {getQuestionOrder(question)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge enabled={question.enable} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center">
                          <ImageIcon
                            className={`h-4 w-4 ${
                              question.image ? 'text-[#65A30D]' : 'text-[#94A3B8]'
                            }`}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSheet(question)}
                            className="text-[#0F172A] transition hover:opacity-70"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-[#EF4444] transition hover:opacity-70"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-[#64748B]">{paginationLabel}</p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-[#E5E7EB]"
                onClick={() => setCurrentPage((previous) => Math.max(previous - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-[#E5E7EB]"
                onClick={() => setCurrentPage((previous) => Math.min(previous + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </section>
      </div>

      <QuestionFormSheet
        open={isFormSheetOpen}
        onOpenChange={(open) => {
          setIsFormSheetOpen(open);

          if (!open) {
            setSelectedQuestion(null);
            setFormData(initialQuestionFormState);
            setSubmitError('');
          }
        }}
        mode={formMode}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmitForm}
      />
    </>
  );
}

type CategoryBadgeProps = {
  label: string;
};

function CategoryBadge({ label }: CategoryBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-[#E9D5FF] bg-[#FAF5FF] px-3 py-1 text-xs font-medium text-[#9333EA]">
      {label}
    </span>
  );
}

type OriginBadgeProps = {
  origin: QuestionOrigin;
};

const ORIGIN_LABELS: Record<QuestionOrigin, string> = {
  ORIGINAL: 'Original',
  EXTERNAL: 'Simplificada',
};

function OriginBadge({ origin }: OriginBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-[#86EFAC] bg-[#F0FDF4] px-3 py-1 text-xs font-medium text-[#65A30D]">
      {ORIGIN_LABELS[origin] ?? origin}
    </span>
  );
}

type StatusBadgeProps = {
  enabled: boolean;
};

function StatusBadge({ enabled }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        enabled
          ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]'
          : 'border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]'
      }`}
    >
      {enabled ? 'OK' : 'Erro'}
    </span>
  );
}
