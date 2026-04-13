import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, Upload } from 'lucide-react';

import { QuestionFormSheet } from '@/components/questions/QuestionFormSheet';
import { initialQuestionFormState } from '@/components/questions/question-form.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  getQuestionsByMockExamId,
  updateQuestion,
} from '@/services/question.service';
import type {
  CreateQuestionPayload,
  Question,
  QuestionFormData,
  QuestionsFilters,
  QuestionType,
  UpdateQuestionPayload,
} from '@/types/question.types';

const PAGE_SIZE = 20;

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(initialQuestionFormState);

  const [discipline, setDiscipline] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<QuestionType | ''>('');
  const [year, setYear] = useState('');
  const [mockExamId, setMockExamId] = useState('');

  const filters = useMemo<QuestionsFilters>(
    () => ({
      discipline: discipline || undefined,
      content: content || undefined,
      type: type || undefined,
      year: year ? Number(year) : undefined,
      mockExamId: mockExamId || undefined,
      page: 0,
      size: PAGE_SIZE,
    }),
    [discipline, content, type, year, mockExamId]
  );

  const loadQuestions = async () => {
    try {
      setIsLoading(true);

      const response = mockExamId
        ? await getQuestionsByMockExamId(mockExamId, {
            discipline: discipline || undefined,
            content: content || undefined,
            type: type || undefined,
            year: year ? Number(year) : undefined,
            page: 0,
            size: PAGE_SIZE,
          })
        : await getQuestions(filters);

      const activeQuestions = response.content.filter((question) => question.enable);
      setQuestions(activeQuestions);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSearch = async () => {
    await loadQuestions();
  };

  const handleClearFilters = async () => {
    setDiscipline('');
    setContent('');
    setType('');
    setYear('');
    setMockExamId('');

    try {
      setIsLoading(true);
      const response = await getQuestions({
        page: 0,
        size: PAGE_SIZE,
      });

      const activeQuestions = response.content.filter((question) => question.enable);
      setQuestions(activeQuestions);
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
    setFormMode('edit');
    setSelectedQuestion(question);
    setFormData({
      discipline: question.discipline,
      content: question.content,
      question: question.question,
      alternativeA: question.alternatives.A,
      alternativeB: question.alternatives.B,
      alternativeC: question.alternatives.C,
      alternativeD: question.alternatives.D,
      alternativeE: question.alternatives.E,
      correctAnswer: question.correctAnswer,
      answerExplanation: question.answerExplanation,
      type: question.type,
      year: String(question.year),
      mockExamId: question.mockExamId ?? '',
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

          <div className="flex items-center gap-3">
            <Button variant="outline" type="button">
              <Upload />
              Importar CSV
            </Button>

            <Button type="button" onClick={handleOpenCreateSheet}>
              <Plus />
              Nova questão
            </Button>
          </div>
        </header>

        <section className="rounded-xl border bg-background p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Input
              placeholder="Filtrar por disciplina"
              value={discipline}
              onChange={(event) => setDiscipline(event.target.value)}
            />

            <Input
              placeholder="Filtrar por conteúdo"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />

            <select
              value={type}
              onChange={(event) => setType(event.target.value as QuestionType | '')}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
            >
              <option value="">Todos os tipos</option>
              <option value="Simplified">Simplified</option>
              <option value="Original">Original</option>
            </select>

            <Input
              placeholder="Filtrar por ano"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />

            <Input
              placeholder="Filtrar por simulado"
              value={mockExamId}
              onChange={(event) => setMockExamId(event.target.value)}
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
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">Disciplina</th>
                  <th className="px-4 py-3 text-sm font-medium">Conteúdo</th>
                  <th className="px-4 py-3 text-sm font-medium">Questão</th>
                  <th className="px-4 py-3 text-sm font-medium">Tipo</th>
                  <th className="px-4 py-3 text-sm font-medium">Ano</th>
                  <th className="px-4 py-3 text-sm font-medium">Simulado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Carregando questões...
                    </td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma questão encontrada.
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => (
                    <tr key={question.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 text-sm">{question.discipline}</td>
                      <td className="px-4 py-3 text-sm">{question.content}</td>
                      <td className="max-w-[420px] px-4 py-3 text-sm">{question.question}</td>
                      <td className="px-4 py-3 text-sm">{question.type}</td>
                      <td className="px-4 py-3 text-sm">{question.year}</td>
                      <td className="px-4 py-3 text-sm">
                        {question.mockExamId ? question.mockExamId : 'Banco geral'}
                      </td>
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
