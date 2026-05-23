import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ChangeEvent, FormEvent, DragEvent as ReactDragEvent } from 'react';
import { Download, FileUp, ImagePlus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { colors } from '@/constants/colors';
import type { ExamFormData } from '@/types/exam.types';

type ExamFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialValues?: Partial<ExamFormData>;
  isSubmitting?: boolean;
  submitError?: string;
  onSubmit: (data: ExamFormData) => void | Promise<void>;
};

const EXAM_CSV_TEMPLATE_URL = '/modelo-importacao-simulado.csv';

const CSV_COLUMNS_HINT =
  'exam_title, bank, exam_day, discipline, content, question, alternative_a–e, correct_answer, answer_explanation, year';

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

function ExamFormSheetContent({
  mode,
  initialValues,
  isSubmitting = false,
  submitError,
  onOpenChange,
  onSubmit,
}: Omit<ExamFormSheetProps, 'open'>) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [origin, setOrigin] = useState(initialValues?.origin ?? '');
  const [imageFile, setImageFile] = useState<File | null>(initialValues?.imageFile ?? null);
  const [documentFile, setDocumentFile] = useState<File | null>(
    initialValues?.documentFile ?? null
  );
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(() =>
    mode === 'edit' ? (initialValues?.imageUrl ?? null) : null
  );
  const [fileError, setFileError] = useState('');

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createdBlobRef = useRef<string | null>(null);

  const title = mode === 'create' ? 'Novo Simulado' : 'Editar Simulado';
  const subtitle =
    mode === 'create'
      ? 'Importe o simulado completo via arquivo CSV'
      : 'Atualize as informações do simulado';
  const submitLabel = mode === 'create' ? 'Criar Simulado' : 'Salvar alterações';

  useEffect(() => {
    return () => {
      if (createdBlobRef.current) {
        URL.revokeObjectURL(createdBlobRef.current);
      }
    };
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);

    if (createdBlobRef.current) {
      URL.revokeObjectURL(createdBlobRef.current);
      createdBlobRef.current = null;
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      createdBlobRef.current = previewUrl;
      setImagePreviewUrl(previewUrl);
      return;
    }

    setImagePreviewUrl(mode === 'edit' ? (initialValues?.imageUrl ?? null) : null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setDocumentFile(file);
    setFileError('');
  }

  function handleDropFile(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    setDocumentFile(file);
    setFileError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === 'create') {
      if (!documentFile) {
        setFileError('Selecione um arquivo CSV para importar o simulado.');
        return;
      }

      await onSubmit({
        name: '',
        origin: '',
        day: '1',
        imageFile: null,
        documentFile,
      });
      return;
    }

    await onSubmit({
      name,
      origin,
      day: '1',
      imageFile,
      documentFile: null,
      imageUrl: initialValues?.imageUrl,
    });
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

          {mode === 'create' ? (
            <>
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">Formato do CSV</p>
                <p className="mt-1 text-slate-600">
                  Cada linha traz o simulado e as questões. Use o mesmo <strong>exam_title</strong>{' '}
                  e <strong>bank</strong> em todas as linhas.
                </p>
                <p className="mt-2 text-slate-600">
                  <strong>discipline</strong> = nome da matéria cadastrada (ex.: Matemática).{' '}
                  <strong>content</strong> = nome da trilha dessa matéria (ex.: Álgebra). Os nomes
                  devem existir no sistema (seed).
                </p>
                <p className="mt-2 break-words font-mono text-xs text-slate-500">
                  {CSV_COLUMNS_HINT}
                </p>
                <a
                  href={EXAM_CSV_TEMPLATE_URL}
                  download="modelo-importacao-simulado.csv"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#9810FA] hover:underline"
                >
                  <Download size={14} />
                  Baixar modelo de importação
                </a>
              </div>

              <FormField label="Arquivo CSV" error={fileError}>
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDropFile}
                  className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-slate-100 px-6 py-8 text-center"
                >
                  <Upload size={48} className="mb-4 text-slate-400" strokeWidth={1.5} />

                  <p className="text-base font-bold text-slate-900">
                    {documentFile?.name ?? 'Arraste seu arquivo aqui'}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    ou clique para selecionar um arquivo
                  </p>

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 h-10 gap-2 rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90"
                    style={{ backgroundColor: colors.buttonQuestion }}
                  >
                    <FileUp size={16} />
                    Selecionar Arquivo
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    aria-label="Selecionar arquivo CSV do simulado"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Imagem do Simulado">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-xl bg-slate-100 transition hover:bg-slate-200"
                >
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Imagem do simulado"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus size={40} className="text-neutral-500" strokeWidth={1.5} />
                  )}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Selecionar imagem do simulado"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </FormField>

              <FormField label="Nome do Simulado">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Simulado ENEM | Janeiro - 2021"
                  className={inputClassName()}
                  required
                />
              </FormField>

              <FormField label="Origem">
                <input
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  placeholder="ENEM"
                  className={inputClassName()}
                  required
                />
              </FormField>
            </>
          )}

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

export function ExamFormSheet({
  open,
  onOpenChange,
  mode,
  initialValues,
  isSubmitting,
  submitError,
  onSubmit,
}: ExamFormSheetProps) {
  const formKey = mode === 'edit' ? `edit-${initialValues?.name}` : 'create';

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
          <ExamFormSheetContent
            key={formKey}
            mode={mode}
            initialValues={initialValues}
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
