import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';

import { QuestionFormSheet } from '@/components/questions/QuestionFormSheet';
import { initialQuestionFormState } from '@/components/questions/question-form.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createQuestion,
  deleteQuestion,
  getQuestionExams,
  getQuestionPaths,
  getQuestions,
  updateQuestion,
} from '@/services/question.service';
import type {
  CreateQuestionPayload,
  Question,
  QuestionExam,
  QuestionFormData,
  QuestionOrigin,
  QuestionPath,
  QuestionsFilters,
  UpdateQuestionPayload,
} from '@/types/question.types';

const PAGE_SIZE = 20;

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paths, setPaths] = useState<QuestionPath[]>([]);
  const [exams, setExams] = useState<QuestionExam[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(initialQuestionFormState);

  const [pathId, setPathId] = useState('');
  const [examId, setExamId] = useState('');
  const [origin, setOrigin] = useState<QuestionOrigin | ''>('');
  const [year, setYear] = useState('');

  const filters = useMemo<QuestionsFilters>(
    () => ({
      path_id: pathId || undefined,
      exam_id: examId || undefined,
      origin: origin || undefined,
      year: year ? Number(year) : undefined,
      page: 0,
      size: PAGE_SIZE,
    }),
    [pathId, examId, origin, year]
  );

  const loadFilterOptions = async () => {
    try {
      setIsLoadingFilters(true);

      const [pathsResponse, examsResponse] = await Promise.all([
        getQuestionPaths(),
        getQuestionExams(),
      ]);

      setPaths(pathsResponse);
      setExams(examsResponse);
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const loadQuestions = async () => {
    try {
      setIsLoading(true);

      const response = await getQuestions(filters);
      const enabledQuestions = response.content.filter((question) => question.enable);
      console.log('questions response', response.content);
      setQuestions(enabledQuestions);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
    loadQuestions();
  }, []);

  const handleSearch = async () => {
    await loadQuestions();
  };

  const handleClearFilters = async () => {
    setPathId('');
    setExamId('');
    setOrigin('');
    setYear('');

    try {
      setIsLoading(true);
      const response = await getQuestions({
        page: 0,
        size: PAGE_SIZE,
      });

      const enabledQuestions = response.content.filter((question) => question.enable);
      setQuestions(enabledQuestions);
    } catch (error) {
      console.error('Erro ao limpar filtros:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateSheet = () => {
    setFormMode('create');
    setSelectedQuestion(null);
    setFormData(initialQuestionFormState);
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
    try {
      await deleteQuestion(id);
      setQuestions((previousQuestions) =>
        previousQuestions.filter((question) => question.id !== id)
      );
    } catch (error) {
      console.error('Erro ao excluir questão:', error);
    }
  };

  const getSubjectNameByPathId = (pathId: string) => {
    const selectedPath = paths.find((path) => path.id === pathId);
    return selectedPath?.subject?.name ?? '-';
  };

  const handleSubmitForm = async (payload: CreateQuestionPayload | UpdateQuestionPayload) => {
    try {
      setIsSubmitting(true);

      if (formMode === 'create') {
        await createQuestion(payload as CreateQuestionPayload);
      } else if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, payload as UpdateQuestionPayload);
      }

      setIsFormSheetOpen(false);
      setSelectedQuestion(null);
      setFormData(initialQuestionFormState);
      await loadQuestions();
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Questões</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as questões da base educacional da plataforma.
            </p>
          </div>

          <Button type="button" onClick={handleOpenCreateSheet}>
            <Plus />
            Nova questão
          </Button>
        </header>

        <section className="rounded-xl border bg-background p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={pathId}
              onChange={(event) => setPathId(event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              disabled={isLoadingFilters}
            >
              <option value="">
                {isLoadingFilters ? 'Carregando trilhas...' : 'Filtrar por trilha'}
              </option>
              {paths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.subject.name} - {path.name}
                </option>
              ))}
            </select>

            <select
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              disabled={isLoadingFilters}
            >
              <option value="">
                {isLoadingFilters ? 'Carregando simulados...' : 'Filtrar por simulado'}
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>

            <select
              value={origin}
              onChange={(event) => setOrigin(event.target.value as QuestionOrigin | '')}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
            >
              <option value="">Filtrar por origem</option>
              <option value="ORIGINAL">ORIGINAL</option>
              <option value="ENGLISH">ENGLISH</option>
              <option value="SPANISH">SPANISH</option>
            </select>

            <Input
              placeholder="Filtrar por ano"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button type="button" onClick={handleSearch}>
              <Search />
              Buscar
            </Button>

            <Button variant="outline" type="button" onClick={handleClearFilters}>
              Limpar filtros
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">Matéria</th>
                  <th className="px-4 py-3 text-sm font-medium">Trilha</th>
                  <th className="px-4 py-3 text-sm font-medium">Questão</th>
                  <th className="px-4 py-3 text-sm font-medium">Origem</th>
                  <th className="px-4 py-3 text-sm font-medium">Ano</th>
                  <th className="px-4 py-3 text-sm font-medium">Simulado</th>
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Carregando questões...
                    </td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma questão encontrada.
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => (
                    <tr key={question.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 text-sm">
                        {getSubjectNameByPathId(question.path_id)}
                      </td>
                      <td className="px-4 py-3 text-sm">{question.path?.name ?? '-'}</td>
                      <td className="max-w-[420px] px-4 py-3 text-sm">{question.text}</td>
                      <td className="px-4 py-3 text-sm">{question.origin}</td>
                      <td className="px-4 py-3 text-sm">{question.year}</td>
                      <td className="px-4 py-3 text-sm">{question.exam?.name ?? 'Banco geral'}</td>
                      <td className="px-4 py-3 text-sm">{question.enable ? 'Ativa' : 'Inativa'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleOpenEditSheet(question)}
                          >
                            Editar
                          </Button>

                          <Button
                            variant="destructive"
                            type="button"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
          }
        }}
        mode={formMode}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitForm}
      />
    </>
  );
}
