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
import { getQuestionExams, getQuestionPaths } from '@/services/question.service';
import type {
  CreateQuestionPayload,
  QuestionAlternativeLetter,
  QuestionExam,
  QuestionFormData,
  QuestionOrigin,
  QuestionPath,
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
  const [paths, setPaths] = React.useState<QuestionPath[]>([]);
  const [exams, setExams] = React.useState<QuestionExam[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = React.useState(false);

  const title = mode === 'create' ? 'Nova questão' : 'Editar questão';
  const description =
    mode === 'create'
      ? 'Preencha os campos abaixo para cadastrar uma nova questão.'
      : 'Atualize as informações da questão selecionada.';

  React.useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);

        const [pathsResponse, examsResponse] = await Promise.all([
          getQuestionPaths(),
          getQuestionExams(),
        ]);

        setPaths(pathsResponse);
        setExams(examsResponse);
      } catch (error) {
        console.error('Erro ao carregar opções do formulário:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

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

    if (!formData.path_id) newErrors.path_id = 'Selecione uma trilha.';
    if (!formData.text.trim()) newErrors.text = 'Informe o texto da questão.';
    if (!formData.year.trim()) {
      newErrors.year = 'Informe o ano.';
    } else if (Number.isNaN(Number(formData.year))) {
      newErrors.year = 'Informe um ano válido.';
    }

    if (!formData.alternativeA.trim()) newErrors.alternativeA = 'Informe a alternativa A.';
    if (!formData.alternativeB.trim()) newErrors.alternativeB = 'Informe a alternativa B.';
    if (!formData.alternativeC.trim()) newErrors.alternativeC = 'Informe a alternativa C.';
    if (!formData.alternativeD.trim()) newErrors.alternativeD = 'Informe a alternativa D.';
    if (!formData.alternativeE.trim()) newErrors.alternativeE = 'Informe a alternativa E.';

    if (formData.number.trim() && Number.isNaN(Number(formData.number))) {
      newErrors.number = 'Informe um número válido.';
    }

    if (formData.day.trim() && Number.isNaN(Number(formData.day))) {
      newErrors.day = 'Informe um dia válido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildAlternatives = () => {
    const alternativesMap: Record<QuestionAlternativeLetter, string> = {
      A: formData.alternativeA.trim(),
      B: formData.alternativeB.trim(),
      C: formData.alternativeC.trim(),
      D: formData.alternativeD.trim(),
      E: formData.alternativeE.trim(),
    };

    return (Object.entries(alternativesMap) as [QuestionAlternativeLetter, string][]).map(
      ([letter, text]) => ({
        letter,
        text,
        is_correct: formData.correctAlternative === letter,
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    const basePayload = {
      path_id: formData.path_id,
      exam_id: formData.exam_id || null,
      text: formData.text.trim(),
      feedback: formData.feedback.trim() || null,
      image: formData.image.trim() || null,
      number: formData.number.trim() ? Number(formData.number) : null,
      year: Number(formData.year),
      day: formData.day.trim() ? Number(formData.day) : null,
      language: formData.language.trim() || null,
      origin: formData.origin as QuestionOrigin,
      alternatives: buildAlternatives(),
    };

    if (mode === 'create') {
      await onSubmit(basePayload satisfies CreateQuestionPayload);
      return;
    }

    await onSubmit({
      ...basePayload,
      enable: formData.enable,
    } satisfies UpdateQuestionPayload);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrors({});
    }

    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="center" className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
          <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
            <FormField label="Trilha" error={errors.path_id}>
              <select
                value={formData.path_id}
                onChange={(event) => updateField('path_id', event.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                disabled={isLoadingOptions}
              >
                <option value="">
                  {isLoadingOptions ? 'Carregando trilhas...' : 'Selecione uma trilha'}
                </option>
                {paths.map((path) => (
                  <option key={path.id} value={path.id}>
                    {path.subject.name} - {path.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Simulado">
              <select
                value={formData.exam_id}
                onChange={(event) => updateField('exam_id', event.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                disabled={isLoadingOptions}
              >
                <option value="">
                  {isLoadingOptions ? 'Carregando simulados...' : 'Banco geral'}
                </option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Origem">
              <select
                value={formData.origin}
                onChange={(event) => updateField('origin', event.target.value as QuestionOrigin)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              >
                <option value="ORIGINAL">ORIGINAL</option>
                <option value="ENGLISH">ENGLISH</option>
                <option value="SPANISH">SPANISH</option>
              </select>
            </FormField>

            <FormField label="Ano" error={errors.year}>
              <Input
                value={formData.year}
                onChange={(event) => updateField('year', event.target.value)}
                placeholder="Ex: 2024"
              />
            </FormField>

            <FormField label="Número" error={errors.number}>
              <Input
                value={formData.number}
                onChange={(event) => updateField('number', event.target.value)}
                placeholder="Opcional"
              />
            </FormField>

            <FormField label="Dia" error={errors.day}>
              <Input
                value={formData.day}
                onChange={(event) => updateField('day', event.target.value)}
                placeholder="Opcional"
              />
            </FormField>

            <FormField label="Idioma">
              <Input
                value={formData.language}
                onChange={(event) => updateField('language', event.target.value)}
                placeholder="Opcional"
              />
            </FormField>

            <FormField label="URL da imagem">
              <Input
                value={formData.image}
                onChange={(event) => updateField('image', event.target.value)}
                placeholder="https://..."
              />
            </FormField>

            {mode === 'edit' ? (
              <FormField label="Status">
                <select
                  value={formData.enable ? 'enabled' : 'disabled'}
                  onChange={(event) => updateField('enable', event.target.value === 'enabled')}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                >
                  <option value="enabled">Ativa</option>
                  <option value="disabled">Inativa</option>
                </select>
              </FormField>
            ) : null}

            <div className="md:col-span-2">
              <FormField label="Texto da questão" error={errors.text}>
                <textarea
                  value={formData.text}
                  onChange={(event) => updateField('text', event.target.value)}
                  placeholder="Digite o texto da questão"
                  className="min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Feedback">
                <textarea
                  value={formData.feedback}
                  onChange={(event) => updateField('feedback', event.target.value)}
                  placeholder="Digite o feedback da questão"
                  className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none"
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

            <FormField label="Alternativa correta">
              <select
                value={formData.correctAlternative}
                onChange={(event) =>
                  updateField('correctAlternative', event.target.value as QuestionAlternativeLetter)
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
          </div>

          <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>

            <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
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
