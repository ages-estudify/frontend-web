import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  CreateQuestionPayload,
  QuestionAlternativeKey,
  QuestionFormData,
  QuestionType,
  UpdateQuestionPayload,
} from '@/types/question.types';

type QuestionFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  formData: QuestionFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionFormData>>;
  isSubmitting?: boolean;
  onSubmit: (payload: CreateQuestionPayload | UpdateQuestionPayload) => Promise<void> | void;
};

export function QuestionFormSheet({
  open,
  onOpenChange,
  mode,
  formData,
  setFormData,
  isSubmitting = false,
  onSubmit,
}: QuestionFormSheetProps) {
  const [errors, setErrors] = React.useState<Partial<Record<keyof QuestionFormData, string>>>({});

  const title = mode === 'create' ? 'Nova questão' : 'Editar questão';
  const description =
    mode === 'create'
      ? 'Preencha os campos abaixo para cadastrar uma nova questão.'
      : 'Atualize as informações da questão selecionada.';

  const updateField = <K extends keyof QuestionFormData>(field: K, value: QuestionFormData[K]) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof QuestionFormData, string>> = {};

    if (!formData.discipline.trim()) newErrors.discipline = 'Informe a disciplina.';
    if (!formData.content.trim()) newErrors.content = 'Informe o conteúdo.';
    if (!formData.question.trim()) newErrors.question = 'Informe o enunciado da questão.';
    if (!formData.alternativeA.trim()) newErrors.alternativeA = 'Informe a alternativa A.';
    if (!formData.alternativeB.trim()) newErrors.alternativeB = 'Informe a alternativa B.';
    if (!formData.alternativeC.trim()) newErrors.alternativeC = 'Informe a alternativa C.';
    if (!formData.alternativeD.trim()) newErrors.alternativeD = 'Informe a alternativa D.';
    if (!formData.alternativeE.trim()) newErrors.alternativeE = 'Informe a alternativa E.';
    if (!formData.answerExplanation.trim()) {
      newErrors.answerExplanation = 'Informe a explicação da resposta.';
    }
    if (!formData.year.trim()) {
      newErrors.year = 'Informe o ano.';
    } else if (Number.isNaN(Number(formData.year))) {
      newErrors.year = 'Informe um ano válido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): CreateQuestionPayload | UpdateQuestionPayload => ({
    discipline: formData.discipline.trim(),
    content: formData.content.trim(),
    question: formData.question.trim(),
    alternatives: {
      A: formData.alternativeA.trim(),
      B: formData.alternativeB.trim(),
      C: formData.alternativeC.trim(),
      D: formData.alternativeD.trim(),
      E: formData.alternativeE.trim(),
    },
    correctAnswer: formData.correctAnswer as QuestionAlternativeKey,
    answerExplanation: formData.answerExplanation.trim(),
    type: formData.type as QuestionType,
    year: Number(formData.year),
    mockExamId: formData.mockExamId.trim() || null,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    await onSubmit(buildPayload());
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrors({});
    }

    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="center" className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
          <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
            <FormField label="Disciplina" error={errors.discipline}>
              <Input
                value={formData.discipline}
                onChange={(event) => updateField('discipline', event.target.value)}
                placeholder="Ex: Matemática"
              />
            </FormField>

            <FormField label="Conteúdo" error={errors.content}>
              <Input
                value={formData.content}
                onChange={(event) => updateField('content', event.target.value)}
                placeholder="Ex: Geometria Plana"
              />
            </FormField>

            <FormField label="Tipo">
              <select
                value={formData.type}
                onChange={(event) => updateField('type', event.target.value as QuestionType)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              >
                <option value="Original">Original</option>
                <option value="Simplified">Simplified</option>
              </select>
            </FormField>

            <FormField label="Ano" error={errors.year}>
              <Input
                value={formData.year}
                onChange={(event) => updateField('year', event.target.value)}
                placeholder="Ex: 2024"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Simulado (ID)">
                <Input
                  value={formData.mockExamId}
                  onChange={(event) => updateField('mockExamId', event.target.value)}
                  placeholder="Opcional"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Enunciado da questão" error={errors.question}>
                <textarea
                  value={formData.question}
                  onChange={(event) => updateField('question', event.target.value)}
                  placeholder="Digite o enunciado da questão"
                  className="min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none"
                />
              </FormField>
            </div>

            <FormField label="Alternativa A" error={errors.alternativeA}>
              <Input
                value={formData.alternativeA}
                onChange={(event) => updateField('alternativeA', event.target.value)}
                placeholder="Digite a alternativa A"
              />
            </FormField>

            <FormField label="Alternativa B" error={errors.alternativeB}>
              <Input
                value={formData.alternativeB}
                onChange={(event) => updateField('alternativeB', event.target.value)}
                placeholder="Digite a alternativa B"
              />
            </FormField>

            <FormField label="Alternativa C" error={errors.alternativeC}>
              <Input
                value={formData.alternativeC}
                onChange={(event) => updateField('alternativeC', event.target.value)}
                placeholder="Digite a alternativa C"
              />
            </FormField>

            <FormField label="Alternativa D" error={errors.alternativeD}>
              <Input
                value={formData.alternativeD}
                onChange={(event) => updateField('alternativeD', event.target.value)}
                placeholder="Digite a alternativa D"
              />
            </FormField>

            <FormField label="Alternativa E" error={errors.alternativeE}>
              <Input
                value={formData.alternativeE}
                onChange={(event) => updateField('alternativeE', event.target.value)}
                placeholder="Digite a alternativa E"
              />
            </FormField>

            <FormField label="Resposta correta">
              <select
                value={formData.correctAnswer}
                onChange={(event) =>
                  updateField('correctAnswer', event.target.value as QuestionAlternativeKey)
                }
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              >
                <option value="A">Alternativa A</option>
                <option value="B">Alternativa B</option>
                <option value="C">Alternativa C</option>
                <option value="D">Alternativa D</option>
                <option value="E">Alternativa E</option>
              </select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Explicação da resposta" error={errors.answerExplanation}>
                <textarea
                  value={formData.answerExplanation}
                  onChange={(event) => updateField('answerExplanation', event.target.value)}
                  placeholder="Digite a explicação da resposta"
                  className="min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none"
                />
              </FormField>
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : mode === 'create'
                  ? 'Criar questão'
                  : 'Salvar alterações'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  error?: string;
};

function FormField({ label, children, error }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
