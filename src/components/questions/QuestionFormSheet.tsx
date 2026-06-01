import * as React from 'react';
import { ImageUp, X } from 'lucide-react';

import { splitQuestionText, joinQuestionText } from '@/components/questions/question-text.utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { colors } from '@/constants/colors';
import { getQuestionPaths } from '@/services/question.service';
import type {
  CreateQuestionPayload,
  QuestionAlternativeLetter,
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
  submitError?: string;
  /** Na revisão de import CSV a ordem é obrigatória. */
  requireOrder?: boolean;
  onSubmit: (payload: CreateQuestionPayload | UpdateQuestionPayload) => Promise<void> | void;
};

const alternativeLetters: QuestionAlternativeLetter[] = ['A', 'B', 'C', 'D', 'E'];

type FormFieldErrorKey = keyof QuestionFormData | 'title' | 'statement';
type FormErrors = Partial<Record<FormFieldErrorKey, string>>;

export function QuestionFormSheet({
  open,
  onOpenChange,
  mode,
  formData,
  setFormData,
  isSubmitting = false,
  submitError = '',
  requireOrder = false,
  onSubmit,
}: QuestionFormSheetProps) {
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [paths, setPaths] = React.useState<QuestionPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = React.useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState('');
  const [selectedFileName, setSelectedFileName] = React.useState('');
  const [isDraggingImage, setIsDraggingImage] = React.useState(false);
  const [questionTitle, setQuestionTitle] = React.useState('');
  const [questionStatement, setQuestionStatement] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const imagePreviewUrl = formData.image.trim() || null;

  const title = mode === 'create' ? 'Nova Questão' : 'Editar Questão';

  const cssVars = {
    '--input-focus': colors.inputFocus,
    '--button-question': colors.buttonQuestion,
    '--button-alternative': colors.buttonAlternative,
  } as React.CSSProperties;

  React.useEffect(() => {
    const loadPaths = async () => {
      try {
        setIsLoadingPaths(true);
        const response = await getQuestionPaths();
        setPaths(response);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
      } finally {
        setIsLoadingPaths(false);
      }
    };

    if (open) {
      loadPaths();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || paths.length === 0) return;

    const currentPath = paths.find((path) => path.id === formData.path_id);

    if (currentPath) {
      setSelectedSubjectId(currentPath.subject_id);
    }
  }, [open, paths, formData.path_id]);

  React.useEffect(() => {
    if (!open) return;

    const { title, statement } = splitQuestionText(formData.text);
    setQuestionTitle(title);
    setQuestionStatement(statement);
  }, [open, formData.text]);

  const subjectOptions = React.useMemo(() => {
    const subjectMap = new Map<string, { id: string; name: string }>();

    paths.forEach((path) => {
      if (!path.subject) return;

      subjectMap.set(path.subject.id, {
        id: path.subject.id,
        name: path.subject.name,
      });
    });

    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [paths]);

  const filteredPaths = React.useMemo(() => {
    if (!selectedSubjectId) return [];

    return paths
      .filter((path) => path.subject_id === selectedSubjectId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [paths, selectedSubjectId]);

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

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);

    const currentPath = paths.find((path) => path.id === formData.path_id);

    if (!currentPath || currentPath.subject_id !== subjectId) {
      updateField('path_id', '');
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') resolve(result);
        else reject(new Error('Não foi possível converter a imagem.'));
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    try {
      const base64 = await fileToBase64(file);
      updateField('image', base64);
      setSelectedFileName(file.name);
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImageFile(file);
    event.target.value = '';
  };

  const handleDragOverImage = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(true);
  };

  const handleDragLeaveImage = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);
  };

  const handleDropImage = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    await processImageFile(file);
  };

  const handleRemoveImage = (event: React.MouseEvent) => {
    event.stopPropagation();
    updateField('image', '');
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!selectedSubjectId) {
      newErrors.path_id = 'Selecione uma matéria.';
    }

    if (!formData.path_id) {
      newErrors.path_id = 'Selecione uma trilha.';
    }

    if (!questionTitle.trim()) {
      newErrors.title = 'Informe o título da questão.';
    }

    if (!questionStatement.trim()) {
      newErrors.statement = 'Informe o enunciado da questão.';
    }

    if (requireOrder && !formData.number.trim()) {
      newErrors.number = 'Informe a ordem.';
    } else if (formData.number.trim() && Number.isNaN(Number(formData.number))) {
      newErrors.number = 'Informe um número válido.';
    }

    if (!formData.alternativeA.trim()) newErrors.alternativeA = 'Informe a alternativa A.';
    if (!formData.alternativeB.trim()) newErrors.alternativeB = 'Informe a alternativa B.';
    if (!formData.alternativeC.trim()) newErrors.alternativeC = 'Informe a alternativa C.';
    if (!formData.alternativeD.trim()) newErrors.alternativeD = 'Informe a alternativa D.';
    if (!formData.alternativeE.trim()) newErrors.alternativeE = 'Informe a alternativa E.';

    if (formData.year.trim() && Number.isNaN(Number(formData.year))) {
      newErrors.year = 'Informe um ano válido.';
    }

    if (formData.day.trim() && Number.isNaN(Number(formData.day))) {
      newErrors.day = 'Informe um dia válido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): CreateQuestionPayload | UpdateQuestionPayload => {
    const fullText = joinQuestionText(questionTitle, questionStatement);

    const alternatives: CreateQuestionPayload['alternatives'] = [
      {
        letter: 'A',
        text: formData.alternativeA.trim(),
        is_correct: formData.correctAlternative === 'A',
      },
      {
        letter: 'B',
        text: formData.alternativeB.trim(),
        is_correct: formData.correctAlternative === 'B',
      },
      {
        letter: 'C',
        text: formData.alternativeC.trim(),
        is_correct: formData.correctAlternative === 'C',
      },
      {
        letter: 'D',
        text: formData.alternativeD.trim(),
        is_correct: formData.correctAlternative === 'D',
      },
      {
        letter: 'E',
        text: formData.alternativeE.trim(),
        is_correct: formData.correctAlternative === 'E',
      },
    ];

    const basePayload = {
      path_id: formData.path_id,
      exam_id: formData.exam_id.trim() || null,
      text: fullText,
      feedback: formData.feedback.trim() || 'Sem explicação informada.',
      image: formData.image.trim() || null,
      number: formData.number.trim() ? Number(formData.number) : null,
      year: formData.year.trim() ? Number(formData.year) : new Date().getFullYear(),
      day: formData.day.trim() ? Number(formData.day) : null,
      language: formData.language.trim() || null,
      origin: formData.origin,
      alternatives,
    };

    if (mode === 'edit') {
      return {
        ...basePayload,
        enable: formData.enable,
      };
    }

    return basePayload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    await onSubmit(buildPayload());
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrors({});
      setSelectedFileName('');
      setIsDraggingImage(false);
      setQuestionTitle('');
      setQuestionStatement('');
    }

    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="center"
        className="!left-1/2 !top-1/2 !h-auto !max-h-[90vh] !w-[min(92vw,760px)] !max-w-[760px] !translate-x-[-50%] !translate-y-[-50%] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl"
      >
        <div style={cssVars} className="flex max-h-[90vh] flex-col bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-[18px] font-bold leading-none text-gray-900">{title}</h2>
          </div>

          <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5 px-6 py-4">
              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="Título da Questão *" error={errors.title}>
                  <TextInput
                    value={questionTitle}
                    onChange={(event) => {
                      setQuestionTitle(event.target.value);
                      setErrors((previous) => ({ ...previous, title: undefined }));
                    }}
                    placeholder="Ex: Interpretação de Texto - Machado de Assis"
                    hasError={!!errors.title}
                  />
                </FormField>

                <FormField label="Matéria *" error={errors.path_id}>
                  <select
                    value={selectedSubjectId}
                    onChange={(event) => handleSubjectChange(event.target.value)}
                    className={inputClassName(!!errors.path_id)}
                    disabled={isLoadingPaths}
                  >
                    <option value="">
                      {isLoadingPaths ? 'Carregando matérias...' : 'Selecione uma matéria'}
                    </option>
                    {subjectOptions.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr_110px]">
                <FormField label="Origem *">
                  <select
                    value={formData.origin}
                    onChange={(event) =>
                      updateField('origin', event.target.value as QuestionOrigin)
                    }
                    className={inputClassName(false)}
                  >
                    <option value="ORIGINAL">ORIGINAL</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                  </select>
                </FormField>

                <FormField label="Trilha *" error={errors.path_id}>
                  <select
                    value={formData.path_id}
                    onChange={(event) => updateField('path_id', event.target.value)}
                    className={inputClassName(!!errors.path_id)}
                    disabled={!selectedSubjectId || isLoadingPaths}
                  >
                    <option value="">
                      {!selectedSubjectId
                        ? 'Selecione uma matéria primeiro'
                        : 'Selecione uma trilha'}
                    </option>
                    {filteredPaths.map((path) => (
                      <option key={path.id} value={path.id}>
                        {path.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label={requireOrder ? 'Ordem *' : 'Ordem (opcional)'}
                  error={errors.number}
                >
                  <TextInput
                    value={formData.number}
                    onChange={(event) => updateField('number', event.target.value)}
                    placeholder="12"
                    hasError={!!errors.number}
                  />
                </FormField>
              </div>

              <FormField label="Enunciado da Questão *" error={errors.statement}>
                <Textarea
                  value={questionStatement}
                  onChange={(event) => {
                    setQuestionStatement(event.target.value);
                    setErrors((previous) => ({ ...previous, statement: undefined }));
                  }}
                  placeholder="Digite o enunciado completo da questão..."
                  hasError={!!errors.statement}
                  className="min-h-[95px]"
                />
              </FormField>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Imagem</label>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleChooseFile}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleChooseFile();
                    }
                  }}
                  onDragOver={handleDragOverImage}
                  onDragLeave={handleDragLeaveImage}
                  onDrop={handleDropImage}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-5 transition-colors ${
                    isDraggingImage
                      ? 'border-[var(--input-focus)] bg-[var(--input-focus)]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Selecionar imagem da questão"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imagePreviewUrl ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="relative w-full">
                        <img
                          src={imagePreviewUrl}
                          alt="Preview da imagem da questão"
                          className="max-h-[220px] w-full rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          aria-label="Remover imagem"
                          onClick={handleRemoveImage}
                          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border-0 bg-black/60 p-0 text-white transition hover:bg-black/80"
                        >
                          <X className="size-4 shrink-0" strokeWidth={2.5} />
                        </button>
                      </div>

                      <div>
                        <p className="text-base font-semibold text-gray-800">
                          {selectedFileName || 'Imagem selecionada'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Arraste outra imagem ou clique para substituir
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChooseFile();
                        }}
                        className="h-10 rounded-lg px-4 text-sm font-medium text-white hover:opacity-90"
                        style={{ backgroundColor: colors.buttonQuestion }}
                      >
                        Selecionar Arquivo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl px-6 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <ImageUp size={34} />
                      </div>

                      <p className="text-base font-semibold text-gray-800">
                        Arraste sua imagem aqui
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        ou clique para selecionar um arquivo
                      </p>

                      <Button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChooseFile();
                        }}
                        className="mt-4 h-10 rounded-lg px-4 text-sm font-medium text-white hover:opacity-90"
                        style={{ backgroundColor: colors.buttonQuestion }}
                      >
                        Selecionar Arquivo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Alternativas *</label>

                <AlternativeInput
                  letter="A"
                  value={formData.alternativeA}
                  onChange={(value) => updateField('alternativeA', value)}
                  placeholder="Alternativa A"
                  error={errors.alternativeA}
                />

                <AlternativeInput
                  letter="B"
                  value={formData.alternativeB}
                  onChange={(value) => updateField('alternativeB', value)}
                  placeholder="Alternativa B"
                  error={errors.alternativeB}
                />

                <AlternativeInput
                  letter="C"
                  value={formData.alternativeC}
                  onChange={(value) => updateField('alternativeC', value)}
                  placeholder="Alternativa C"
                  error={errors.alternativeC}
                />

                <AlternativeInput
                  letter="D"
                  value={formData.alternativeD}
                  onChange={(value) => updateField('alternativeD', value)}
                  placeholder="Alternativa D"
                  error={errors.alternativeD}
                />

                <AlternativeInput
                  letter="E"
                  value={formData.alternativeE}
                  onChange={(value) => updateField('alternativeE', value)}
                  placeholder="Alternativa E"
                  error={errors.alternativeE}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Resposta Correta *</label>

                <div className="grid grid-cols-5 gap-3">
                  {alternativeLetters.map((letter) => {
                    const isSelected = formData.correctAlternative === letter;

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => updateField('correctAlternative', letter)}
                        className={`h-12 rounded-xl border text-sm font-semibold transition-all ${
                          isSelected
                            ? 'border-transparent text-white shadow-sm'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                        style={
                          isSelected ? { backgroundColor: colors.buttonAlternative } : undefined
                        }
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>

              <FormField label="Explicação (Opcional)">
                <Textarea
                  value={formData.feedback}
                  onChange={(event) => updateField('feedback', event.target.value)}
                  placeholder="Explique por que a resposta está correta..."
                  hasError={false}
                  className="min-h-[90px]"
                />
              </FormField>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="h-10 rounded-lg border-gray-300 px-5 text-sm font-medium text-gray-700"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-lg px-5 text-sm font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: colors.buttonQuestion }}
                >
                  {isSubmitting
                    ? 'Salvando...'
                    : mode === 'create'
                      ? 'Adicionar Questão'
                      : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type FormFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

function TextInput({ hasError = false, className = '', ...props }: TextInputProps) {
  return <input {...props} className={`${inputClassName(hasError)} ${className}`} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

function Textarea({ hasError = false, className = '', ...props }: TextareaProps) {
  return <textarea {...props} className={`${textareaClassName(hasError)} ${className}`} />;
}

type AlternativeInputProps = {
  letter: QuestionAlternativeLetter;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
};

function AlternativeInput({ letter, value, onChange, placeholder, error }: AlternativeInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="w-6 shrink-0 text-sm font-medium text-gray-700">{letter})</span>

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={inputClassName(!!error)}
        />
      </div>

      {error ? <p className="pl-9 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function inputClassName(hasError: boolean) {
  return [
    'h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-900 outline-none transition-all',
    'placeholder:text-gray-400',
    'focus:border-[var(--input-focus)] focus:ring-2 focus:ring-[var(--input-focus)]/20',
    hasError ? 'border-red-400' : 'border-gray-300',
  ].join(' ');
}

function textareaClassName(hasError: boolean) {
  return [
    'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all resize-none',
    'placeholder:text-gray-400',
    'focus:border-[var(--input-focus)] focus:ring-2 focus:ring-[var(--input-focus)]/20',
    hasError ? 'border-red-400' : 'border-gray-300',
  ].join(' ');
}
