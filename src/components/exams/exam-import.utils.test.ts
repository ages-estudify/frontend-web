import { describe, expect, it } from 'vitest';

import type { AdminQuestion } from '@/types/question.types';

import {
  buildExamReviewItems,
  countByStatus,
  humanizeExamImportError,
  parseExamCsvContent,
  readFileAsText,
  type ExamCsvRow,
} from './exam-import.utils';

const SAMPLE_CSV = `exam_title,bank,exam_day,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,year
Simulado ENEM | Janeiro - 2021,ENEM,1,Matemática,Álgebra,Qual é o valor de x?,1,2,3,4,5,C,Explicação A,2024
Simulado ENEM | Janeiro - 2021,ENEM,2,Português,Redação,O que se espera da introdução?,A,B,C,D,E,B,Explicação B,2024`;

function buildQuestion(overrides: Partial<AdminQuestion>): AdminQuestion {
  return {
    id: 'q-1',
    discipline: 'Matemática',
    content: 'Álgebra',
    question: 'Qual é o valor de x?',
    mockExamId: 'exam-1',
    enable: true,
    year: 2024,
    bank: 'ENEM',
    ...overrides,
  };
}

describe('exam-import.utils', () => {
  describe('parseExamCsvContent', () => {
    it('parseia múltiplas linhas com as 14 colunas do simulado', () => {
      const rows = parseExamCsvContent(SAMPLE_CSV);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        rowNumber: 2,
        exam_title: 'Simulado ENEM | Janeiro - 2021',
        bank: 'ENEM',
        exam_day: '1',
        discipline: 'Matemática',
        content: 'Álgebra',
        question: 'Qual é o valor de x?',
        correct_answer: 'C',
        year: '2024',
      });
      expect(rows[1].rowNumber).toBe(3);
      expect(rows[1].exam_day).toBe('2');
    });

    it('retorna vazio quando há só o cabeçalho', () => {
      expect(parseExamCsvContent('exam_title,bank,question\n')).toEqual([]);
    });

    it('respeita vírgulas dentro de campos entre aspas duplas', () => {
      const csv = `exam_title,bank,exam_day,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,year
Simulado,ENEM,1,Mat,Álg,"Quanto vale x, se x+2=4?",1,2,3,4,5,B,"Resposta: 2",2024`;

      const rows = parseExamCsvContent(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0].question).toBe('Quanto vale x, se x+2=4?');
      expect(rows[0].answer_explanation).toBe('Resposta: 2');
    });

    it('respeita quebras de linha dentro de campos entre aspas (questão multilinha)', () => {
      const csv = `exam_title,bank,exam_day,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,year
Simulado,ENEM,1,Inglês,Leitura e Interpretação,"A Teen's View

It has some downsides, like anxiety in teens.",a,b,c,d,e,D,"Os downsides, ou seja, a ansiedade.",2022`;

      const rows = parseExamCsvContent(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0].discipline).toBe('Inglês');
      expect(rows[0].content).toBe('Leitura e Interpretação');
      expect(rows[0].correct_answer).toBe('D');
      expect(rows[0].year).toBe('2022');
      expect(rows[0].question).toContain('downsides');
      expect(rows[0].answer_explanation).toBe('Os downsides, ou seja, a ansiedade.');
    });

    it('mantém aspas escapadas como "" dentro do mesmo campo', () => {
      const csv = `exam_title,bank,exam_day,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,year
Simulado,ENEM,1,Mat,Álg,"Texto com ""aspas""",1,2,3,4,5,A,exp,2024`;

      const rows = parseExamCsvContent(csv);
      expect(rows[0].question).toBe('Texto com "aspas"');
    });

    it('retorna string vazia em campos cuja coluna não existe no cabeçalho', () => {
      const csv = `exam_title,bank,exam_day
Simulado,ENEM,1`;

      const rows = parseExamCsvContent(csv);
      expect(rows[0].exam_title).toBe('Simulado');
      expect(rows[0].question).toBe('');
      expect(rows[0].discipline).toBe('');
    });
  });

  describe('buildExamReviewItems', () => {
    const rows = parseExamCsvContent(SAMPLE_CSV);

    it('marca linha com erro reportado pelo backend', () => {
      const items = buildExamReviewItems(
        rows,
        [{ line: 3, error: 'Trilha não encontrada' }],
        [buildQuestion({ id: 'q-a', question: 'Qual é o valor de x?' })]
      );

      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({ status: 'success', importedQuestionId: 'q-a' });
      expect(items[1].status).toBe('error');
      expect(items[1].error).toBe('Trilha não encontrada');
      expect(items[1].importedQuestionId).toBeUndefined();
    });

    it('casa questão pelo texto exato quando houver correspondência', () => {
      const items = buildExamReviewItems(
        rows,
        [],
        [
          buildQuestion({ id: 'q-redacao', question: 'O que se espera da introdução?' }),
          buildQuestion({ id: 'q-algebra', question: 'Qual é o valor de x?' }),
        ]
      );

      expect(items[0].importedQuestionId).toBe('q-algebra');
      expect(items[1].importedQuestionId).toBe('q-redacao');
    });

    it('usa ordem como fallback quando não há texto idêntico', () => {
      const items = buildExamReviewItems(
        rows,
        [],
        [
          buildQuestion({ id: 'q-1', question: 'Texto diferente 1' }),
          buildQuestion({ id: 'q-2', question: 'Texto diferente 2' }),
        ]
      );

      expect(items[0].importedQuestionId).toBe('q-1');
      expect(items[1].importedQuestionId).toBe('q-2');
    });

    it('usa fallback "Linha N" e "-" quando os campos estão vazios', () => {
      const blankRow: ExamCsvRow = {
        rowNumber: 5,
        exam_title: '',
        bank: '',
        exam_day: '',
        discipline: '',
        content: '',
        question: '',
        alternative_a: '',
        alternative_b: '',
        alternative_c: '',
        alternative_d: '',
        alternative_e: '',
        correct_answer: '',
        answer_explanation: '',
        year: '',
      };

      const items = buildExamReviewItems([blankRow], [{ line: 5, error: '' }], []);

      expect(items[0]).toMatchObject({
        title: 'Linha 5',
        subjectName: '-',
        trailName: '-',
        status: 'error',
        error: 'Erro ao importar a linha.',
      });
    });

    it('retorna importedQuestionId undefined quando não há questões disponíveis', () => {
      const items = buildExamReviewItems(rows, [], []);

      expect(items.every((item) => item.importedQuestionId === undefined)).toBe(true);
    });

    it('usa fallback no caminho de sucesso quando discipline/content estão vazios', () => {
      const row: ExamCsvRow = {
        rowNumber: 2,
        exam_title: 'Simulado',
        bank: 'ENEM',
        exam_day: '1',
        discipline: '',
        content: '',
        question: 'Pergunta',
        alternative_a: 'a',
        alternative_b: 'b',
        alternative_c: 'c',
        alternative_d: 'd',
        alternative_e: 'e',
        correct_answer: 'A',
        answer_explanation: '',
        year: '2024',
      };

      const items = buildExamReviewItems(
        [row],
        [],
        [
          {
            id: 'q',
            discipline: '',
            content: '',
            question: 'Pergunta',
            mockExamId: null,
            enable: true,
            year: 2024,
            bank: 'ENEM',
          },
        ]
      );

      expect(items[0]).toMatchObject({
        status: 'success',
        subjectName: '-',
        trailName: '-',
      });
    });
  });

  describe('readFileAsText', () => {
    it('lê o conteúdo de um File como texto', async () => {
      const file = new File(['linha1\nlinha2'], 'arquivo.csv', { type: 'text/csv' });

      await expect(readFileAsText(file)).resolves.toBe('linha1\nlinha2');
    });
  });

  describe('humanizeExamImportError', () => {
    it('traduz "Path not found" indicando matéria e trilha', () => {
      const message = humanizeExamImportError(
        "Path not found for discipline 'Português' and content 'Prosa'"
      );

      expect(message).toContain('Português');
      expect(message).toContain('Prosa');
      expect(message).toContain('não encontrada');
      expect(message).not.toContain('Path not found');
    });

    it('usa mensagem padrão quando vazio', () => {
      expect(humanizeExamImportError('')).toBe('Erro ao importar a linha.');
      expect(humanizeExamImportError(undefined)).toBe('Erro ao importar a linha.');
    });

    it('mantém a mensagem original quando não há tradução conhecida', () => {
      expect(humanizeExamImportError('Algo inesperado')).toBe('Algo inesperado');
    });
  });

  describe('countByStatus', () => {
    it('conta sucessos e erros', () => {
      const sampleRow: ExamCsvRow = {
        rowNumber: 2,
        exam_title: '',
        bank: '',
        exam_day: '',
        discipline: '',
        content: '',
        question: '',
        alternative_a: '',
        alternative_b: '',
        alternative_c: '',
        alternative_d: '',
        alternative_e: '',
        correct_answer: '',
        answer_explanation: '',
        year: '',
      };

      const counts = countByStatus([
        {
          id: '1',
          rowNumber: 2,
          title: 't',
          subjectName: 's',
          trailName: 't',
          status: 'success',
          csvRow: sampleRow,
        },
        {
          id: '2',
          rowNumber: 3,
          title: 't',
          subjectName: 's',
          trailName: 't',
          status: 'error',
          csvRow: sampleRow,
        },
      ]);

      expect(counts).toEqual({ total: 2, successCount: 1, errorCount: 1 });
    });
  });
});
