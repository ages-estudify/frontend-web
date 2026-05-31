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

function parseCsvLine(line: string): string[] {
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

export function parseExamCsvContent(content: string): ExamCsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);

    const getValue = (name: string) => {
      const headerIndex = headers.indexOf(name);
      return headerIndex >= 0 ? (values[headerIndex] ?? '') : '';
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

export function countByStatus(items: ExamReviewItem[]): {
  total: number;
  successCount: number;
  errorCount: number;
} {
  const successCount = items.filter((item) => item.status === 'success').length;
  const errorCount = items.filter((item) => item.status === 'error').length;
  return { total: items.length, successCount, errorCount };
}
