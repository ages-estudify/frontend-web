import { describe, expect, it } from 'vitest';

import type { QuestionPath } from '@/types/question.types';

import {
  getRowDisplayMeta,
  getRowValidationIssues,
  normalizeImportData,
  parseCsvContent,
  resolvePathIdFromRow,
  resolveReviewStatus,
} from './import-csv.utils';

const mockPaths: QuestionPath[] = [
  {
    id: 'path-algebra',
    name: 'Álgebra',
    subject: { id: 'sub-math', name: 'Matemática' },
  },
];

describe('import-csv.utils', () => {
  it('parseia formato admin com discipline, content e question', () => {
    const csv = `discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year
Matemática,Álgebra,Qual é o valor de x?,1,2,3,4,5,C,Explicação,ORIGINAL,2024`;

    const rows = parseCsvContent(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      rowNumber: 2,
      format: 'admin',
      discipline: 'Matemática',
      content: 'Álgebra',
      text: 'Qual é o valor de x?',
      feedback: 'Explicação',
      correct_answer: 'C',
      origin: 'ORIGINAL',
    });
  });

  it('normaliza resposta da API com ou sem wrapper data', () => {
    const direct = {
      total: 1,
      successCount: 1,
      errorCount: 0,
      results: [{ row: 2, success: true, id: 'q-1' }],
    };

    expect(normalizeImportData(direct)).toEqual(direct);
    expect(normalizeImportData({ data: direct })).toEqual(direct);
  });

  it('resolve path_id pelo par discipline/content', () => {
    const csv = `discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year
Matemática,Álgebra,Pergunta?,a,b,c,d,e,A,fb,ORIGINAL,2024`;

    const row = parseCsvContent(csv)[0];

    expect(resolvePathIdFromRow(row, mockPaths)).toBe('path-algebra');
    expect(getRowDisplayMeta(row, mockPaths)).toMatchObject({
      title: 'Pergunta?',
      subjectName: 'Matemática',
      trailName: 'Álgebra',
    });
  });

  it('marca erro quando ordem não foi informada no CSV', () => {
    const csv = `discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year
Matemática,Álgebra,Pergunta?,a,b,c,d,e,A,fb,ORIGINAL,2024`;

    const row = parseCsvContent(csv)[0];

    expect(getRowValidationIssues(row, mockPaths)).toContain('Ordem não informada');
    expect(resolveReviewStatus(row, mockPaths).status).toBe('error');
  });
});
