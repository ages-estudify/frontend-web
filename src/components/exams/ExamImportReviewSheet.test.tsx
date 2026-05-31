import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as questionService from '@/services/question.service';
import type { Question, QuestionPath } from '@/types/question.types';

import { ExamImportReviewSheet } from './ExamImportReviewSheet';
import type { ExamCsvRow, ExamReviewItem } from './exam-import.utils';

vi.mock('@/services/question.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/question.service')>();
  return {
    ...actual,
    getQuestionPaths: vi.fn(),
    getQuestionById: vi.fn(),
    updateQuestion: vi.fn(),
  };
});

vi.mock('@/components/questions/QuestionFormSheet', () => ({
  QuestionFormSheet: ({
    open,
    onSubmit,
    onOpenChange,
  }: {
    open: boolean;
    onSubmit: (payload: unknown) => void | Promise<void>;
    onOpenChange: (next: boolean) => void;
  }) =>
    open ? (
      <div data-testid="mock-question-form-sheet">
        <button
          type="button"
          data-testid="mock-salvar"
          onClick={() =>
            onSubmit({
              path_id: 'path-algebra',
              exam_id: null,
              text: 'Texto atualizado',
              feedback: 'fb',
              image: null,
              number: 1,
              year: 2024,
              day: 1,
              language: null,
              origin: 'ORIGINAL',
              enable: true,
              alternatives: [],
            })
          }
        >
          Mock Salvar
        </button>
        <button type="button" data-testid="mock-fechar" onClick={() => onOpenChange(false)}>
          Mock Fechar
        </button>
      </div>
    ) : null,
}));

const samplePath: QuestionPath = {
  id: 'path-algebra',
  name: 'Álgebra',
  text: '',
  icon_url: '',
  schedule_position: 0,
  trail_position: 0,
  subject_id: 'sub-mat',
  subject: { id: 'sub-mat', name: 'Matemática', icon_url: '' },
};

const sampleRow: ExamCsvRow = {
  rowNumber: 2,
  exam_title: 'Simulado X',
  bank: 'ENEM',
  exam_day: '1',
  discipline: 'Matemática',
  content: 'Álgebra',
  question: 'Qual é o valor de x?',
  alternative_a: '1',
  alternative_b: '2',
  alternative_c: '3',
  alternative_d: '4',
  alternative_e: '5',
  correct_answer: 'C',
  answer_explanation: 'Explicação',
  year: '2024',
};

const successItem: ExamReviewItem = {
  id: 'item-success',
  rowNumber: 2,
  title: 'Qual é o valor de x?',
  subjectName: 'Matemática',
  trailName: 'Álgebra',
  status: 'success',
  csvRow: sampleRow,
  importedQuestionId: 'q-1',
};

const errorItem: ExamReviewItem = {
  id: 'item-error',
  rowNumber: 3,
  title: 'Linha com erro',
  subjectName: 'Português',
  trailName: 'Redação',
  status: 'error',
  error: 'Trilha não encontrada',
  csvRow: { ...sampleRow, rowNumber: 3, question: 'Linha com erro' },
};

const fullQuestion: Question = {
  id: 'q-1',
  text: 'Qual é o valor de x?',
  origin: 'ORIGINAL',
  year: 2024,
  feedback: 'Explicação',
  day: 1,
  number: 1,
  language: null,
  image: null,
  enable: true,
  path_id: 'path-algebra',
  exam_id: 'exam-1',
  alternatives: [
    { letter: 'A', text: '1', is_correct: false },
    { letter: 'B', text: '2', is_correct: false },
    { letter: 'C', text: '3', is_correct: true },
    { letter: 'D', text: '4', is_correct: false },
    { letter: 'E', text: '5', is_correct: false },
  ],
  path: samplePath,
  exam: null,
};

describe('ExamImportReviewSheet', () => {
  beforeEach(() => {
    vi.mocked(questionService.getQuestionPaths).mockResolvedValue([samplePath]);
    vi.mocked(questionService.getQuestionById).mockResolvedValue(fullQuestion);
    vi.mocked(questionService.updateQuestion).mockResolvedValue(undefined);
  });

  it('renderiza contagens e itens com sucesso e erro', async () => {
    render(
      <ExamImportReviewSheet
        open
        items={[successItem, errorItem]}
        onClose={vi.fn()}
        onFinish={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Revisão de Importação' })).toBeInTheDocument();

    expect(screen.getByText('Qual é o valor de x?')).toBeInTheDocument();
    expect(screen.getByText('Linha com erro')).toBeInTheDocument();
    expect(screen.getByText('Trilha não encontrada')).toBeInTheDocument();

    await waitFor(() => {
      expect(questionService.getQuestionPaths).toHaveBeenCalled();
    });
  });

  it('aciona onFinish ao clicar em Concluído', () => {
    const onFinish = vi.fn();

    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={onFinish} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Concluído' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('aciona onClose pelo botão de fechar', () => {
    const onClose = vi.fn();

    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={onClose} onFinish={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fechar revisão' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('abre QuestionFormSheet ao clicar em Editar Questão e busca a questão', async () => {
    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar Questão' }));

    await waitFor(() => {
      expect(questionService.getQuestionById).toHaveBeenCalledWith('q-1');
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-question-form-sheet')).toBeInTheDocument();
    });
  });

  it('cai no fallback do CSV quando getQuestionById retorna null', async () => {
    vi.mocked(questionService.getQuestionById).mockResolvedValue(null as unknown as Question);

    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar Questão' }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-question-form-sheet')).toBeInTheDocument();
    });
  });

  it('itens não são reexibidos quando recebe items=[] mesmo com sheet aberto', () => {
    const { rerender } = render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={vi.fn()} />
    );

    expect(screen.getByText('Qual é o valor de x?')).toBeInTheDocument();

    rerender(<ExamImportReviewSheet open items={[]} onClose={vi.fn()} onFinish={vi.fn()} />);

    expect(screen.queryByText('Qual é o valor de x?')).not.toBeInTheDocument();
  });

  it('exibe mensagem de erro ao falhar carregamento das trilhas', async () => {
    vi.mocked(questionService.getQuestionPaths).mockRejectedValue(new Error('falha'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={vi.fn()} />
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('fecha QuestionFormSheet ao cancelar edição', async () => {
    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar Questão' }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-question-form-sheet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-fechar'));

    await waitFor(() => {
      expect(screen.queryByTestId('mock-question-form-sheet')).not.toBeInTheDocument();
    });
  });

  it('salva a questão via updateQuestion após edição', async () => {
    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar Questão' }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-question-form-sheet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-salvar'));

    await waitFor(() => {
      expect(questionService.updateQuestion).toHaveBeenCalledWith(
        'q-1',
        expect.objectContaining({ text: 'Texto atualizado' })
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('mock-question-form-sheet')).not.toBeInTheDocument();
    });
  });

  it('exibe mensagem quando salvar questão falha', async () => {
    vi.mocked(questionService.updateQuestion).mockRejectedValueOnce(new Error('boom'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ExamImportReviewSheet open items={[successItem]} onClose={vi.fn()} onFinish={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar Questão' }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-question-form-sheet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-salvar'));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível salvar a questão.')).toBeInTheDocument();
    });

    consoleError.mockRestore();
  });
});
