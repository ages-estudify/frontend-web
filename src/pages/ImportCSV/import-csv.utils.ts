import type { QuestionOrigin, QuestionPath } from '@/types/question.types';

export type ParsedCsvRow = {
  rowNumber: number;
  format: 'legacy' | 'admin';
  path_id: string;
  exam_id: string;
  discipline: string;
  content: string;
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

export type ImportApiResult = {
  row: number;
  success: boolean;
  error?: string;
  id?: string;
};

export type ImportApiData = {
  total: number;
  successCount: number;
  errorCount: number;
  results?: ImportApiResult[];
};

export type ReviewStatus = 'success' | 'missing_image' | 'error';

export type ReviewItem = {
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

function adminTypeToOrigin(type: string): QuestionOrigin {
  return type.trim().toUpperCase() === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL';
}

export function parseCsvContent(content: string): ParsedCsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const isAdminFormat = headers.includes('question') && headers.includes('discipline');

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);

    const getValue = (...names: string[]) => {
      for (const name of names) {
        const headerIndex = headers.indexOf(name.toLowerCase());
        if (headerIndex >= 0) {
          return values[headerIndex] ?? '';
        }
      }
      return '';
    };

    if (isAdminFormat) {
      const type = getValue('type');
      return {
        rowNumber: index + 2,
        format: 'admin',
        path_id: getValue('path_id', 'pathid'),
        exam_id: getValue('mock_exam_id', 'exam_id'),
        discipline: getValue('discipline', 'subject'),
        content: getValue('content'),
        text: getValue('question'),
        feedback: getValue('answer_explanation', 'feedback'),
        number: getValue('number'),
        year: getValue('year'),
        day: getValue('day'),
        language: getValue('language'),
        origin: adminTypeToOrigin(type || 'ORIGINAL'),
        alternative_a: getValue('alternative_a'),
        alternative_b: getValue('alternative_b'),
        alternative_c: getValue('alternative_c'),
        alternative_d: getValue('alternative_d'),
        alternative_e: getValue('alternative_e'),
        correct_answer: getValue('correct_answer'),
      };
    }

    return {
      rowNumber: index + 2,
      format: 'legacy',
      path_id: getValue('path_id'),
      exam_id: getValue('exam_id'),
      discipline: '',
      content: '',
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

export function normalizeImportData(response: unknown): ImportApiData | undefined {
  if (!response || typeof response !== 'object') return undefined;

  if ('data' in response && response.data && typeof response.data === 'object') {
    return response.data as ImportApiData;
  }

  if ('total' in response && 'results' in response) {
    return response as ImportApiData;
  }

  return undefined;
}

export function resolvePathIdFromRow(row: ParsedCsvRow, paths: QuestionPath[]): string {
  if (row.path_id) return row.path_id;

  const match = paths.find(
    (path) => path.name === row.content && path.subject?.name === row.discipline
  );

  return match?.id ?? '';
}

export function getRowValidationIssues(row: ParsedCsvRow, paths: QuestionPath[]): string[] {
  const issues: string[] = [];

  if (!row.text.trim()) {
    issues.push('Enunciado da questão não informado');
  }

  if (!row.number.trim()) {
    issues.push('Ordem não informada');
  } else if (Number.isNaN(Number(row.number))) {
    issues.push('Ordem inválida');
  }

  if (!resolvePathIdFromRow(row, paths)) {
    issues.push('Matéria/trilha não encontrada');
  }

  return issues;
}

export function resolveReviewStatus(
  row: ParsedCsvRow,
  paths: QuestionPath[],
  apiError?: string
): { status: ReviewStatus; error?: string } {
  if (apiError) {
    return { status: 'error', error: apiError };
  }

  const validationIssues = getRowValidationIssues(row, paths);

  if (validationIssues.length > 0) {
    return { status: 'error', error: validationIssues.join('. ') };
  }

  return { status: 'missing_image' };
}

export function getRowDisplayMeta(row: ParsedCsvRow, paths: QuestionPath[]) {
  const path = paths.find((item) => item.id === row.path_id);

  return {
    title: row.text || `Linha ${row.rowNumber}`,
    subjectName: row.discipline || path?.subject?.name || '-',
    trailName: row.content || path?.name || '-',
    pathId: resolvePathIdFromRow(row, paths),
  };
}
