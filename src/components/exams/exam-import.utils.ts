import type { AdminQuestionApi } from '@/types/question.types';

export type ExamCsvRow = {
  rowNumber: number;
  exam_title: string;
  bank: string;
  exam_day: string;
  discipline: string;
  content: string;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  alternative_e: string;
  correct_answer: string;
  answer_explanation: string;
  year: string;
};

export type ExamImportError = {
  line: number;
  error: string;
};

export type ExamReviewStatus = 'success' | 'error';

export type ExamReviewItem = {
  id: string;
  rowNumber: number;
  title: string;
  subjectName: string;
  trailName: string;
  status: ExamReviewStatus;
  error?: string;
  csvRow: ExamCsvRow;
  importedQuestionId?: string;
};

export const EXAM_CSV_HEADERS = [
  'exam_title',
  'bank',
  'exam_day',
  'discipline',
  'content',
  'question',
  'alternative_a',
  'alternative_b',
  'alternative_c',
  'alternative_d',
  'alternative_e',
  'correct_answer',
  'answer_explanation',
  'year',
] as const;

function parseCsvRecords(content: string): string[][] {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');

  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let insideQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const nextChar = normalized[index + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n') {
      record.push(field);
      field = '';
      records.push(record);
      record = [];
    } else {
      field += char;
    }
  }

  record.push(field);
  records.push(record);

  // Descarta registros totalmente vazios (ex.: quebra de linha final do arquivo).
  return records.filter((row) => !(row.length === 1 && row[0].trim() === ''));
}

export function parseExamCsvContent(content: string): ExamCsvRow[] {
  const records = parseCsvRecords(content);

  if (records.length <= 1) return [];

  const headers = records[0].map((header) => header.trim().toLowerCase());

  return records.slice(1).map((values, index) => {
    const getValue = (name: string) => {
      const headerIndex = headers.indexOf(name);
      return headerIndex >= 0 ? (values[headerIndex] ?? '').trim() : '';
    };

    return {
      rowNumber: index + 2,
      exam_title: getValue('exam_title'),
      bank: getValue('bank'),
      exam_day: getValue('exam_day'),
      discipline: getValue('discipline'),
      content: getValue('content'),
      question: getValue('question'),
      alternative_a: getValue('alternative_a'),
      alternative_b: getValue('alternative_b'),
      alternative_c: getValue('alternative_c'),
      alternative_d: getValue('alternative_d'),
      alternative_e: getValue('alternative_e'),
      correct_answer: getValue('correct_answer'),
      answer_explanation: getValue('answer_explanation'),
      year: getValue('year'),
    };
  });
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler o arquivo.'));
    reader.readAsText(file);
  });
}

/**
 * Casa linhas do CSV com questões importadas. Backend não devolve o índice da linha
 * de cada questão criada, então pareamos: erros vão para suas linhas; o resto é
 * distribuído na ordem do CSV entre as questões que vieram do `getQuestionsByMockExamId`,
 * usando texto idêntico como desempate quando possível.
 */
export function buildExamReviewItems(
  rows: ExamCsvRow[],
  errors: ExamImportError[],
  importedQuestions: AdminQuestionApi[]
): ExamReviewItem[] {
  const errorsByRow = new Map<number, string>();
  errors.forEach((entry) => {
    errorsByRow.set(entry.line, entry.error || 'Erro ao importar a linha.');
  });

  const remainingQuestions = [...importedQuestions];
  const consumed = new Set<string>();

  const takeQuestionForRow = (row: ExamCsvRow): AdminQuestionApi | undefined => {
    const exactMatchIndex = remainingQuestions.findIndex(
      (question) => question.question.trim() === row.question.trim() && !consumed.has(question.id)
    );

    if (exactMatchIndex >= 0) {
      const match = remainingQuestions[exactMatchIndex];
      remainingQuestions.splice(exactMatchIndex, 1);
      consumed.add(match.id);
      return match;
    }

    const next = remainingQuestions.find((question) => !consumed.has(question.id));
    if (next) {
      const index = remainingQuestions.indexOf(next);
      remainingQuestions.splice(index, 1);
      consumed.add(next.id);
    }
    return next;
  };

  return rows.map((row) => {
    const error = errorsByRow.get(row.rowNumber);

    if (error) {
      return {
        id: `exam-review-${row.rowNumber}`,
        rowNumber: row.rowNumber,
        title: row.question || `Linha ${row.rowNumber}`,
        subjectName: row.discipline || '-',
        trailName: row.content || '-',
        status: 'error',
        error,
        csvRow: row,
      };
    }

    const question = takeQuestionForRow(row);

    return {
      id: `exam-review-${row.rowNumber}`,
      rowNumber: row.rowNumber,
      title: row.question || `Linha ${row.rowNumber}`,
      subjectName: row.discipline || '-',
      trailName: row.content || '-',
      status: 'success',
      csvRow: row,
      importedQuestionId: question?.id,
    };
  });
}

export function humanizeExamImportError(raw?: string): string {
  if (!raw || !raw.trim()) return 'Erro ao importar a linha.';

  const pathNotFound = raw.match(/Path not found for discipline '(.*)' and content '(.*)'/);
  if (pathNotFound) {
    const [, discipline, content] = pathNotFound;
    return `Matéria "${discipline}" com trilha "${content}" não encontrada. Confira se a matéria e a trilha existem no sistema e estão escritas exatamente igual — maiúsculas e acentos contam.`;
  }

  return raw;
}

export function countByStatus(items: ExamReviewItem[]): {
  total: number;
  successCount: number;
  errorCount: number;
} {
  const successCount = items.filter((item) => item.status === 'success').length;
  const errorCount = items.filter((item) => item.status === 'error').length;
  return { total: items.length, successCount, errorCount };
}
