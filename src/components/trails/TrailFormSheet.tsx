import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { colors } from '@/constants/colors';
import type { TrailFormData, TrailPayload, TrailSubjectOption } from '@/types/trail.types';

type TrailFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialValues?: Partial<TrailFormData>;
  subjectOptions: TrailSubjectOption[];
  isLoadingSubjects?: boolean;
  isSubmitting?: boolean;
  submitError?: string;
  onSubmit: (data: TrailPayload) => void | Promise<void>;
};

type TrailFormErrors = Partial<
  Record<keyof Pick<TrailFormData, 'name' | 'subjectId' | 'order'>, string>
>;

const cssVars = {
  '--input-focus': colors.inputFocus,
  '--button-primary': colors.buttonQuestion,
} as CSSProperties;

function inputClassName(hasError = false) {
  return [
    'h-12 w-full rounded-xl border-0 bg-slate-100 px-4 text-sm text-slate-700 outline-none transition-all',
    'placeholder:text-slate-500',
    'focus:bg-white focus:ring-2 focus:ring-[var(--input-focus)]/20',
    hasError ? 'ring-2 ring-red-400' : '',
  ].join(' ');
}

function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-950">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function TrailFormSheetContent({
  mode,
  initialValues,
  subjectOptions,
  isLoadingSubjects = false,
  isSubmitting = false,
  submitError,
  onOpenChange,
  onSubmit,
}: Omit<TrailFormSheetProps, 'open'>) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [text, setText] = useState(initialValues?.text ?? '');
  const [iconUrl, setIconUrl] = useState(initialValues?.iconUrl ?? '');
  const [order, setOrder] = useState(initialValues?.order ?? '');
  const [subjectId, setSubjectId] = useState(initialValues?.subjectId ?? '');
  const [errors, setErrors] = useState<TrailFormErrors>({});

  const title = mode === 'create' ? 'Nova Trilha' : 'Editar Trilha';
  const subtitle =
    mode === 'create'
      ? 'Crie uma trilha vazia para organizar questões depois'
      : 'Atualize as informações da trilha';
  const submitLabel = mode === 'create' ? 'Criar Trilha' : 'Salvar alterações';

  function validateForm(): TrailPayload | null {
    const nextErrors: TrailFormErrors = {};
    const parsedOrder = Number(order);

    if (!name.trim()) {
      nextErrors.name = 'Informe o nome da trilha.';
    }

    if (!subjectId.trim()) {
      nextErrors.subjectId = 'Selecione uma disciplina.';
    }

    if (!order.trim() || !Number.isFinite(parsedOrder)) {
      nextErrors.order = 'Informe uma ordem válida.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      name: name.trim(),
      text: text.trim(),
      iconUrl: iconUrl.trim(),
      order: parsedOrder,
      subjectId: subjectId.trim(),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = validateForm();
    if (!payload) return;

    await onSubmit(payload);
  }

  return (
    <div style={cssVars} className="flex max-h-[90vh] flex-col bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <h2 className="text-[18px] font-bold leading-none text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 px-6 py-4">
          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <FormField label="Nome da Trilha *" error={errors.name}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Álgebra"
              className={inputClassName(!!errors.name)}
            />
          </FormField>

          <FormField label="Descrição">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Resumo do conteúdo trabalhado nesta trilha"
              className="min-h-[120px] w-full resize-none rounded-xl border-0 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-[var(--input-focus)]/20"
            />
          </FormField>

          <FormField label="URL do ícone">
            <input
              value={iconUrl}
              onChange={(event) => setIconUrl(event.target.value)}
              placeholder="https://cdn.exemplo.com/icone.svg"
              className={inputClassName()}
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Ordem *" error={errors.order}>
              <input
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                placeholder="1"
                inputMode="numeric"
                className={inputClassName(!!errors.order)}
              />
            </FormField>

            <FormField label="Disciplina *" error={errors.subjectId}>
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                aria-label="Selecionar disciplina"
                className={inputClassName(!!errors.subjectId)}
                disabled={isLoadingSubjects || subjectOptions.length === 0}
              >
                <option value="">
                  {isLoadingSubjects
                    ? 'Carregando disciplinas...'
                    : subjectOptions.length === 0
                      ? 'Nenhuma disciplina disponível'
                      : 'Selecione uma disciplina'}
                </option>
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-lg border-slate-200 px-5 text-sm font-medium text-slate-950"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg px-5 text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: colors.buttonQuestion }}
            >
              {isSubmitting ? 'Salvando...' : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function TrailFormSheet({
  open,
  onOpenChange,
  mode,
  initialValues,
  subjectOptions,
  isLoadingSubjects,
  isSubmitting,
  submitError,
  onSubmit,
}: TrailFormSheetProps) {
  const formKey = mode === 'edit' ? `edit-${initialValues?.name ?? 'trail'}` : 'create';

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="center"
        className="!left-1/2 !top-1/2 !h-auto !max-h-[90vh] !w-[min(92vw,760px)] !max-w-[760px] !translate-x-[-50%] !translate-y-[-50%] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl"
      >
        {open && (
          <TrailFormSheetContent
            key={formKey}
            mode={mode}
            initialValues={initialValues}
            subjectOptions={subjectOptions}
            isLoadingSubjects={isLoadingSubjects}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
