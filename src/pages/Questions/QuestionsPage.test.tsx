import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as questionService from '@/services/question.service';
import type { Question, QuestionPath } from '@/types/question.types';

import { QuestionsPage } from './QuestionsPage';

vi.mock('@/components/questions/QuestionFormSheet', () => ({
  QuestionFormSheet: () => null,
}));

vi.mock('@/services/question.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/question.service')>();
  return {
    ...actual,
    getQuestionPaths: vi.fn(),
    getQuestions: vi.fn(),
    deleteQuestion: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
  };
});

const mockPath: QuestionPath = {
  id: 'path-1',
  name: 'Trilha Alpha',
  text: '',
  icon_url: '',
  schedule_position: 0,
  trail_position: 1,
  subject_id: 'sub-1',
  subject: { id: 'sub-1', name: 'Matemática', icon_url: '' },
};

const mockQuestion: Question = {
  id: 'q1',
  text: 'Qual é a resposta correta?',
  origin: 'ORIGINAL',
  year: 2024,
  feedback: null,
  day: null,
  number: 1,
  language: 'pt',
  image: null,
  enable: true,
  path_id: 'path-1',
  exam_id: null,
  alternatives: [],
  path: mockPath,
  exam: null,
};

describe('QuestionsPage', () => {
  beforeEach(() => {
    vi.mocked(questionService.getQuestionPaths).mockResolvedValue([mockPath]);
    vi.mocked(questionService.getQuestions).mockResolvedValue({
      content: [mockQuestion],
      page: 0,
      size: 100,
      totalElements: 1,
    });
  });

  it('deve renderizar o título e a descrição da página', () => {
    render(<QuestionsPage />);

    expect(screen.getByRole('heading', { name: 'Gestão de Questões' })).toBeInTheDocument();
    expect(screen.getByText('Gerencie todas as questões do Estudify')).toBeInTheDocument();
  });

  it('deve exibir a busca e o botão de nova questão', () => {
    render(<QuestionsPage />);

    expect(screen.getByPlaceholderText('Buscar questões...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nova Questão/i })).toBeInTheDocument();
  });

  it('deve listar questões após carregar os dados', async () => {
    render(<QuestionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Qual é a resposta correta?')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(within(table).getByText('Matemática')).toBeInTheDocument();
    expect(within(table).getByText('Trilha Alpha')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há questões habilitadas', async () => {
    vi.mocked(questionService.getQuestions).mockResolvedValue({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
    });

    render(<QuestionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma questão encontrada.')).toBeInTheDocument();
    });
  });
});
