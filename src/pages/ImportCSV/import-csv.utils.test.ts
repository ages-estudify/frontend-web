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
    text: 'Álgebra',
    icon_url: '',
    schedule_position: 0,
    trail_position: 0,
    subject_id: 'sub-math',
    subject: { id: 'sub-math', name: 'Matemática', icon_url: '' },
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
      origin: 'EXTERNAL',
    });
  });

  it('parseia formato admin quando o cabeçalho usa "subject" no lugar de "discipline"', () => {
    const csv = `subject,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year,number
Biologia,Genética,Qual é o objeto de estudo da genética?,a,b,c,d,e,A,Explicação,ORIGINAL,2024,1`;

    const rows = parseCsvContent(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      format: 'admin',
      discipline: 'Biologia',
      content: 'Genética',
      text: 'Qual é o objeto de estudo da genética?',
      number: '1',
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

  it('não revalida matéria/trilha localmente quando o backend já importou a linha', () => {
    const csv = `discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year,number
Biologia,Genética,Pergunta?,a,b,c,d,e,A,fb,ORIGINAL,2024,1`;

    const row = parseCsvContent(csv)[0];

    // Sem o sinal do backend, a validação local não acha o path e marca erro (fallback).
    expect(resolveReviewStatus(row, []).status).toBe('error');

    // Com o backend confirmando o import, confiamos nele: sucesso (sem has_image).
    expect(resolveReviewStatus(row, [], undefined, true).status).toBe('success');

    // Erro real reportado pelo backend continua prevalecendo.
    expect(resolveReviewStatus(row, [], 'Falha real', true)).toEqual({
      status: 'error',
      error: 'Falha real',
    });
  });

  it('parseia a coluna has_image de forma tolerante', () => {
    const header =
      'subject,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year,number,has_image';
    const csv = `${header}
Bio,Gen,P1?,a,b,c,d,e,A,fb,ORIGINAL,2024,1,true
Bio,Gen,P2?,a,b,c,d,e,A,fb,ORIGINAL,2024,2,false
Bio,Gen,P3?,a,b,c,d,e,A,fb,ORIGINAL,2024,3,
Bio,Gen,P4?,a,b,c,d,e,A,fb,ORIGINAL,2024,4,SIM`;

    const rows = parseCsvContent(csv);

    expect(rows.map((r) => r.has_image)).toEqual([true, false, false, true]);
  });

  it('marca laranja (missing_image) quando has_image é true e a linha foi importada', () => {
    const header =
      'subject,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year,number,has_image';
    const comImagem = parseCsvContent(`${header}
Bio,Gen,P?,a,b,c,d,e,A,fb,ORIGINAL,2024,1,true`)[0];
    const semImagem = parseCsvContent(`${header}
Bio,Gen,P?,a,b,c,d,e,A,fb,ORIGINAL,2024,1,false`)[0];

    expect(resolveReviewStatus(comImagem, [], undefined, true).status).toBe('missing_image');
    expect(resolveReviewStatus(semImagem, [], undefined, true).status).toBe('success');
  });
});
