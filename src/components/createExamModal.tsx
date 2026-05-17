import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, DragEvent as ReactDragEvent } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';

export type ExamDayOption = {
  label: string;
  value: string;
};

export type CreateExamFormData = {
  name: string;
  origin: string;
  day: string;
  imageFile: File | null;
  documentFile: File | null;
};

export type CreateExamModalLabels = {
  title: string;
  subtitle: string;

  imageLabel: string;
  nameLabel: string;
  originLabel: string;
  dayLabel: string;
  fileLabel: string;

  namePlaceholder: string;
  originPlaceholder: string;

  dragFileTitle: string;
  dragFileSubtitle: string;
  selectFileButton: string;

  cancelButton: string;
  submitButton: string;

  closeAriaLabel: string;
  imageInputAriaLabel: string;
  fileInputAriaLabel: string;
};

type CreateExamModalProps = {
  isOpen: boolean;
  labels: CreateExamModalLabels;
  dayOptions: ExamDayOption[];

  initialValues?: Partial<CreateExamFormData>;

  onClose: () => void;
  onSubmit: (data: CreateExamFormData) => void | Promise<void>;
};

export function CreateExamModal({
  isOpen,
  labels,
  dayOptions,
  initialValues,
  onClose,
  onSubmit,
}: CreateExamModalProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [origin, setOrigin] = useState(initialValues?.origin ?? '');
  const [day, setDay] = useState(initialValues?.day ?? dayOptions[0]?.value ?? '');

  const [imageFile, setImageFile] = useState<File | null>(initialValues?.imageFile ?? null);

  const [documentFile, setDocumentFile] = useState<File | null>(
    initialValues?.documentFile ?? null
  );

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialValues?.name ?? '');
    setOrigin(initialValues?.origin ?? '');
    setDay(initialValues?.day ?? dayOptions[0]?.value ?? '');
    setImageFile(initialValues?.imageFile ?? null);
    setDocumentFile(initialValues?.documentFile ?? null);
  }, [isOpen, initialValues, dayOptions]);

  if (!isOpen) return null;

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setDocumentFile(file);
  }

  function handleDropFile(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0] ?? null;
    setDocumentFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);

      await onSubmit({
        name,
        origin,
        day,
        imageFile,
        documentFile,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[680px] rounded-xl bg-white px-5 py-6 shadow-2xl"
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{labels.title}</h2>

            <p className="mt-2 text-lg text-slate-500">{labels.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={labels.closeAriaLabel}
            className="rounded-md p-1 text-slate-950 transition hover:bg-slate-100"
          >
            <X size={28} />
          </button>
        </header>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-lg font-medium text-slate-950">
              {labels.imageLabel}
            </label>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-lg bg-slate-100 transition hover:bg-slate-200"
            >
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt={labels.imageLabel}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus size={64} className="text-neutral-500" />
              )}
            </button>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              aria-label={labels.imageInputAriaLabel}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="mb-2 block text-lg font-medium text-slate-950">
              {labels.nameLabel}
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={labels.namePlaceholder}
              className="h-12 w-full rounded-lg bg-slate-100 px-4 text-lg text-slate-700 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-lg font-medium text-slate-950">
              {labels.originLabel}
            </label>

            <input
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder={labels.originPlaceholder}
              className="h-12 w-full rounded-lg bg-slate-100 px-4 text-lg text-slate-700 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-lg font-medium text-slate-950">
              {labels.dayLabel}
            </label>

            <select
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className="h-12 rounded-lg bg-slate-100 px-4 pr-12 text-lg text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
            >
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-lg font-medium text-slate-950">
              {labels.fileLabel}
            </label>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDropFile}
              className="flex min-h-[340px] flex-col items-center justify-center rounded-xl bg-slate-100 px-6 text-center"
            >
              <Upload size={72} className="mb-7 text-slate-400" />

              <strong className="text-2xl font-bold text-slate-900">
                {documentFile?.name ?? labels.dragFileTitle}
              </strong>

              <span className="mt-7 text-lg text-slate-600">{labels.dragFileSubtitle}</span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-lg bg-purple-600 px-5 py-3 text-lg font-semibold text-white transition hover:bg-purple-700"
              >
                {labels.selectFileButton}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                aria-label={labels.fileInputAriaLabel}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <footer className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-6 py-3 text-lg font-medium text-slate-950 transition hover:bg-slate-50"
          >
            {labels.cancelButton}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-purple-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {labels.submitButton}
          </button>
        </footer>
      </form>
    </div>
  );
}
