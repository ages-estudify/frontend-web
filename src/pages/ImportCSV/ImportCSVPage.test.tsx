import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as questionService from '@/services/question.service';

import { ImportCSVPage } from './ImportCSVPage';

vi.mock('@/components/questions/QuestionFormSheet', () => ({
  QuestionFormSheet: () => null,
}));

vi.mock('@/services/question.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/question.service')>();
  return {
    ...actual,
    getQuestionPaths: vi.fn(),
    importQuestions: vi.fn(),
    getQuestionById: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
  };
});

const csvHeader =
  'path_id,exam_id,text,feedback,number,year,day,language,origin,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer';

const minimalCsvRow = 'p1,e1,Questão teste,fb,1,2024,1,pt,ORIGINAL,a,b,c,d,e,A';

describe('ImportCSVPage', () => {
  beforeEach(() => {
    vi.mocked(questionService.getQuestionPaths).mockResolvedValue([]);
    vi.mocked(questionService.importQuestions).mockResolvedValue({
      success: true,
      data: {
        total: 1,
        successCount: 1,
        errorCount: 0,
        results: [{ row: 2, success: true, id: 'q-imported-1' }],
      },
    });
  });

  it('deve renderizar o título e a descrição da página', () => {
    render(<ImportCSVPage />);

    expect(screen.getByRole('heading', { name: 'Importar CSV' })).toBeInTheDocument();
    expect(screen.getByText('Importe questões em massa via arquivo CSV')).toBeInTheDocument();
  });

  it('deve exibir erro ao selecionar arquivo com extensão inválida', async () => {
    render(<ImportCSVPage />);

    const input = document.querySelector('#questions-import-file') as HTMLInputElement;
    const file = new File(['x'], 'doc.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Selecione um arquivo CSV ou Excel válido.')).toBeInTheDocument();
    });
  });

  it('deve iniciar a revisão após importar um CSV válido', async () => {
    render(<ImportCSVPage />);

    const input = document.querySelector('#questions-import-file') as HTMLInputElement;
    const csvContent = `${csvHeader}\n${minimalCsvRow}`;
    const file = new File([csvContent], 'questoes.csv', { type: 'text/csv' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Revisão de Importação' })).toBeInTheDocument();
    });

    expect(questionService.importQuestions).toHaveBeenCalledWith(file);
    expect(screen.getByText('Questão teste')).toBeInTheDocument();
  });
});
