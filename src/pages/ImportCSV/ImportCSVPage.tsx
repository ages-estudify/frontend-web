import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImagePlus,
  Upload,
  X,
} from 'lucide-react';

import { QuestionFormSheet } from '@/components/questions/QuestionFormSheet';
import { initialQuestionFormState } from '@/components/questions/question-form.constants';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import {
  createQuestion,
  getQuestionById,
  getQuestionPaths,
  importQuestions,
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

const acceptedFileTypes = '.csv,.xlsx,.xls';

type ParsedCsvRow = {
  rowNumber: number;
  path_id: string;
  exam_id: string;
  text: string;
  feedback: string;
  number: string;
  year: string;
  day: string;
  language: string;
  origin: QuestionOrigin;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  alternative_e: string;
  correct_answer: string;
};

type ReviewStatus = 'success' | 'missing_image' | 'error';

type ReviewItem = {
  id: string;
  rowNumber: number;
  title: string;
  subjectName: string;
  trailName: string;
  status: ReviewStatus;
  error?: string;
  csvRow: ParsedCsvRow;
  importedQuestionId?: string;
};

type ImportApiResult = {
  row: number;
  success: boolean;
  error?: string;
  id?: string;
};

type ImportApiData = {
  total: number;
  successCount: number;
  errorCount: number;
  results?: ImportApiResult[];
};

function hexToRgba(hex: string, opacity: number) {
  const sanitized = hex.replace('#', '');
  const fullHex =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => char + char)
          .join('')
      : sanitized;

  const number = Number.parseInt(fullHex, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function parseCsvContent(content: string): ParsedCsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);

    const getValue = (header: string) => {
      const headerIndex = headers.indexOf(header);
      return headerIndex >= 0 ? (values[headerIndex] ?? '') : '';
    };

    return {
      rowNumber: index + 2,
      path_id: getValue('path_id'),
      exam_id: getValue('exam_id'),
      text: getValue('text'),
      feedback: getValue('feedback'),
      number: getValue('number'),
      year: getValue('year'),
      day: getValue('day'),
      language: getValue('language'),
      origin: (getValue('origin') || 'ORIGINAL') as QuestionOrigin,
      alternative_a: getValue('alternative_a'),
      alternative_b: getValue('alternative_b'),
      alternative_c: getValue('alternative_c'),
      alternative_d: getValue('alternative_d'),
      alternative_e: getValue('alternative_e'),
      correct_answer: getValue('correct_answer'),
    };
  });
}

async function fileToText(file: File) {
  return await file.text();
}

function csvRowToFormData(row: ParsedCsvRow): QuestionFormData {
  return {
    path_id: row.path_id,
    exam_id: row.exam_id,
    text: row.text,
    feedback: row.feedback,
    image: '',
    number: row.number,
    year: row.year,
    day: row.day,
    language: row.language,
    origin: row.origin,
    enable: true,
    alternativeA: row.alternative_a,
    alternativeB: row.alternative_b,
    alternativeC: row.alternative_c,
    alternativeD: row.alternative_d,
    alternativeE: row.alternative_e,
    correctAlternative: (row.correct_answer || 'A') as QuestionFormData['correctAlternative'],
  };
}

function questionToFormData(question: Question): QuestionFormData {
  return {
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
    alternativeA: question.alternatives.find((item) => item.letter === 'A')?.text ?? '',
    alternativeB: question.alternatives.find((item) => item.letter === 'B')?.text ?? '',
    alternativeC: question.alternatives.find((item) => item.letter === 'C')?.text ?? '',
    alternativeD: question.alternatives.find((item) => item.letter === 'D')?.text ?? '',
    alternativeE: question.alternatives.find((item) => item.letter === 'E')?.text ?? '',
    correctAlternative: question.alternatives.find((item) => item.is_correct)?.letter ?? 'A',
  };
}

export function ImportCSVPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [, setIsSubmitting] = useState(false);

  const [paths, setPaths] = useState<QuestionPath[]>([]);

  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [editingReviewItem, setEditingReviewItem] = useState<ReviewItem | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<QuestionFormData>(initialQuestionFormState);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadPaths = async () => {
      try {
        const response = await getQuestionPaths();
        setPaths(response);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
      }
    };

    loadPaths();
  }, []);

  const successCount = reviewItems.filter((item) => item.status === 'success').length;
  const missingImageCount = reviewItems.filter((item) => item.status === 'missing_image').length;
  const errorCount = reviewItems.filter((item) => item.status === 'error').length;

  const getPathMeta = (pathId: string) => {
    const path = paths.find((item) => item.id === pathId);

    return {
      subjectName: path?.subject?.name ?? '-',
      trailName: path?.name ?? '-',
    };
  };

  const buildReviewItems = (rows: ParsedCsvRow[], importData: ImportApiData | undefined) => {
    const errorsByRow = new Map<number, string>();
    const successIdsByRow = new Map<number, string>();

    importData?.results?.forEach((result) => {
      if (!result.success) {
        errorsByRow.set(result.row, result.error || 'Erro ao importar a linha.');
        return;
      }

      if (result.id) {
        successIdsByRow.set(result.row, result.id);
      }
    });

    const nextReviewItems: ReviewItem[] = rows.map((row) => {
      const pathMeta = getPathMeta(row.path_id);

      if (errorsByRow.has(row.rowNumber)) {
        return {
          id: `review-${row.rowNumber}`,
          rowNumber: row.rowNumber,
          title: row.text || `Linha ${row.rowNumber}`,
          subjectName: pathMeta.subjectName,
          trailName: pathMeta.trailName,
          status: 'error',
          error: errorsByRow.get(row.rowNumber),
          csvRow: row,
        };
      }

      return {
        id: `review-${row.rowNumber}`,
        rowNumber: row.rowNumber,
        title: row.text || `Linha ${row.rowNumber}`,
        subjectName: pathMeta.subjectName,
        trailName: pathMeta.trailName,
        status: 'missing_image',
        csvRow: row,
        importedQuestionId: successIdsByRow.get(row.rowNumber),
      };
    });

    console.log('importData', importData);
    console.log('reviewItems', nextReviewItems);

    setReviewItems(nextReviewItems);
    setShowReview(true);
  };

  const runImportReview = async (file: File, rows: ParsedCsvRow[]) => {
    try {
      setIsSubmitting(true);
      setPageError('');
      setPageSuccess('');

      const response = await importQuestions(file);
      const importData = response.data as ImportApiData | undefined;

      buildReviewItems(rows, importData);
    } catch (error) {
      console.error('Erro ao importar questões:', error);
      setPageError('Não foi possível importar o arquivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setPageError('');
    setPageSuccess('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isValidExtension =
      file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isValidExtension) {
      setSelectedFile(null);
      setPageError('Selecione um arquivo CSV ou Excel válido.');
      return;
    }

    setSelectedFile(file);

    if (!file.name.endsWith('.csv')) {
      setPageError('No momento, a revisão automática está disponível apenas para arquivos CSV.');
      return;
    }

    try {
      const content = await fileToText(file);
      const rows = parseCsvContent(content);

      if (rows.length === 0) {
        setPageError('O arquivo CSV não possui linhas válidas para importação.');
        return;
      }

      await runImportReview(file, rows);
    } catch (error) {
      console.error('Erro real ao ler CSV:', error);
      setPageError(
        error instanceof Error
          ? `Não foi possível ler o arquivo CSV: ${error.message}`
          : 'Não foi possível ler o arquivo CSV.'
      );
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setReviewItems([]);
    setShowReview(false);
    setPageError('');
    setPageSuccess('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenCorrection = async (item: ReviewItem) => {
    try {
      setPageError('');
      setEditingReviewItem(item);

      if (item.importedQuestionId) {
        const questionResponse = await getQuestionById(item.importedQuestionId);

        const question =
          questionResponse && typeof questionResponse === 'object' && 'data' in questionResponse
            ? questionResponse.data
            : questionResponse;

        if (!question) {
          setFormMode('create');
          setFormData(csvRowToFormData(item.csvRow));
          setIsFormSheetOpen(true);
          return;
        }

        setFormMode('edit');
        setFormData(questionToFormData(question));
        setIsFormSheetOpen(true);
        return;
      }

      setFormMode('create');
      setFormData(csvRowToFormData(item.csvRow));
      setIsFormSheetOpen(true);
    } catch (error) {
      console.error('Erro ao abrir edição da questão:', error);

      setFormMode('create');
      setFormData(csvRowToFormData(item.csvRow));
      setIsFormSheetOpen(true);
    }
  };

  const handleSaveQuestion = async (payload: CreateQuestionPayload | UpdateQuestionPayload) => {
    if (!editingReviewItem) return;

    try {
      setIsSavingQuestion(true);

      let savedQuestionId = editingReviewItem.importedQuestionId;

      if (formMode === 'edit' && editingReviewItem.importedQuestionId) {
        await updateQuestion(
          editingReviewItem.importedQuestionId,
          payload as UpdateQuestionPayload
        );
      } else {
        const response = await createQuestion(payload as CreateQuestionPayload);

        if (response && typeof response === 'object' && 'id' in response) {
          savedQuestionId = String(response.id);
        }
      }

      const hasImage = Boolean(payload.image);

      setReviewItems((previous) =>
        previous.map((item) =>
          item.id === editingReviewItem.id
            ? {
                ...item,
                importedQuestionId: savedQuestionId,
                status: hasImage ? 'success' : 'missing_image',
                error: undefined,
              }
            : item
        )
      );

      setIsFormSheetOpen(false);
      setEditingReviewItem(null);
      setFormMode('create');
      setFormData(initialQuestionFormState);
    } catch (error) {
      console.error('Erro ao salvar questão da revisão:', error);
      setPageError('Não foi possível salvar a questão.');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleCloseReview = () => {
    setShowReview(false);
    setReviewItems([]);
  };

  const handleFinishImport = () => {
    if (errorCount > 0) return;

    setPageSuccess('Importação concluída com sucesso.');
    setSelectedFile(null);
    setReviewItems([]);
    setShowReview(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-[52px] font-bold leading-none text-[#0F172A]">Importar CSV</h1>
          <p className="mt-2 text-sm text-[#64748B]">Importe questões em massa via arquivo CSV</p>
        </header>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {pageError}
          </div>
        ) : null}

        {pageSuccess ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {pageSuccess}
          </div>
        ) : null}

        {selectedFile && showReview ? (
          <div className="w-fit rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-[#0F172A]">Arquivo</p>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-[#0F172A] transition hover:opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
              <FileSpreadsheet className="h-4 w-4 text-[#64748B]" />
              <span className="text-sm text-[#64748B]">{selectedFile.name}</span>
            </div>
          </div>
        ) : null}

        {!showReview ? (
          <>
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <label
                htmlFor="questions-import-file"
                className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FAFAFA] px-6 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9] text-[#98A2B3]">
                  <Upload className="h-8 w-8" />
                </div>

                <p className="text-[18px] font-semibold text-[#0F172A]">
                  Arraste seu arquivo CSV aqui
                </p>
                <p className="mt-1 text-sm text-[#64748B]">ou clique para selecionar um arquivo</p>

                <div className="mt-6">
                  <Button
                    type="button"
                    className="h-10 rounded-lg px-4 text-sm font-medium text-white hover:opacity-90"
                    style={{ backgroundColor: colors.buttonQuestion }}
                  >
                    Selecionar Arquivo
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  id="questions-import-file"
                  type="file"
                  accept={acceptedFileTypes}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </section>

            <section
              className="rounded-2xl border px-6 py-5 shadow-sm"
              style={{
                backgroundColor: '#EEF4FF',
                borderColor: '#B2CCFF',
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[18px] font-semibold text-[#2445C2]">ⓘ</span>
                <h2 className="text-[18px] font-semibold text-[#2445C2]">Formato do CSV</h2>
              </div>

              <p className="mb-4 text-sm text-[#2445C2]">
                O arquivo CSV deve conter as seguintes colunas na ordem:
              </p>

              <div className="rounded-lg border border-[#C7D7FE] bg-white px-4 py-3 text-sm text-[#0F172A]">
                path_id,exam_id,text,feedback,number,year,day,language,origin,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer
              </div>

              <div className="mt-4">
                <a href="/modelo-importacao-questoes.csv" download="modelo-importacao-questoes.csv">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-lg border-[#D8B4FE] px-4 text-[#9810FA]"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Modelo CSV
                  </Button>
                </a>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0F172A]">Revisão de Importação</h2>
              </div>

              <button
                type="button"
                onClick={handleCloseReview}
                className="text-[#0F172A] transition hover:opacity-70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <ReviewCounter
                label="Sucesso"
                value={successCount}
                background={colors.greenCSV}
                labelColor={colors.greenLabelCSV}
              />

              <ReviewCounter
                label="Falta Imagem"
                value={missingImageCount}
                background={colors.orangeCSV}
                labelColor={colors.orangeLabelCSV}
              />

              <ReviewCounter
                label="Erro"
                value={errorCount}
                background={colors.redCSV}
                labelColor={colors.redLabelCSV}
              />
            </div>

            <div className="space-y-4">
              {reviewItems.map((item) => (
                <ReviewCard key={item.id} item={item} onEdit={() => handleOpenCorrection(item)} />
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={handleFinishImport}
                disabled={errorCount > 0}
                className="h-11 rounded-xl px-8 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: colors.buttonQuestion }}
              >
                Concluído
              </Button>
            </div>
          </section>
        )}
      </div>

      <QuestionFormSheet
        open={isFormSheetOpen}
        onOpenChange={(open) => {
          setIsFormSheetOpen(open);

          if (!open) {
            setEditingReviewItem(null);
            setFormMode('create');
            setFormData(initialQuestionFormState);
          }
        }}
        mode={formMode}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSavingQuestion}
        onSubmit={handleSaveQuestion}
      />
    </>
  );
}

type ReviewCounterProps = {
  label: string;
  value: number;
  background: string;
  labelColor: string;
};

function ReviewCounter({ label, value, background, labelColor }: ReviewCounterProps) {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-xl border px-4 py-2"
      style={{
        backgroundColor: background,
        borderColor: hexToRgba(labelColor, 0.3),
      }}
    >
      <span className="text-sm font-medium" style={{ color: labelColor }}>
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color: labelColor }}>
        {value}
      </span>
    </div>
  );
}

type ReviewCardProps = {
  item: ReviewItem;
  onEdit: () => void;
};

function ReviewCard({ item, onEdit }: ReviewCardProps) {
  const statusMap = {
    success: {
      background: colors.greenCSV,
      border: hexToRgba(colors.greenLabelCSV, 0.3),
      titleColor: '#0F172A',
      textColor: colors.greenLabelCSV,
      icon: <CheckCircle2 className="h-5 w-5" style={{ color: colors.greenLabelCSV }} />,
    },
    missing_image: {
      background: colors.orangeCSV,
      border: hexToRgba(colors.orangeLabelCSV, 0.3),
      titleColor: '#0F172A',
      textColor: colors.orangeLabelCSV,
      icon: <ImagePlus className="h-5 w-5" style={{ color: colors.orangeLabelCSV }} />,
      message: 'Esta questão não tem uma imagem anexada',
    },
    error: {
      background: colors.redCSV,
      border: hexToRgba(colors.redLabelCSV, 0.3),
      titleColor: '#0F172A',
      textColor: colors.redLabelCSV,
      icon: <AlertCircle className="h-5 w-5" style={{ color: colors.redLabelCSV }} />,
      message: item.error || 'Erro ao importar a questão',
    },
  } as const;

  const current = statusMap[item.status];

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        backgroundColor: current.background,
        borderColor: current.border,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {current.icon}
            <p className="truncate text-[18px] font-semibold" style={{ color: current.titleColor }}>
              {item.title}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md border border-[#E5E7EB] bg-white/70 px-2 py-1 text-xs text-[#0F172A]">
              {item.subjectName}
            </span>
            <span className="rounded-md border border-[#E5E7EB] bg-white/70 px-2 py-1 text-xs text-[#0F172A]">
              {item.trailName}
            </span>
          </div>

          <p className="mt-3 text-sm" style={{ color: current.textColor }}>
            {current.message}
          </p>
        </div>

        {item.status !== 'success' ? (
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            className="h-8 rounded-lg border-[#E5E7EB] bg-white px-3 text-sm text-[#0F172A]"
          >
            Editar Questão
          </Button>
        ) : null}
      </div>
    </div>
  );
}
