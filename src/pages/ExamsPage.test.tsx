import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as examService from '@/services/exam.service';
import * as questionService from '@/services/question.service';
import type { ExamListItem } from '@/types/exam.types';

import { ExamsPage } from './ExamsPage';

vi.mock('@/services/exam.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/exam.service')>();
  return {
    ...actual,
    getExams: vi.fn(),
    importExam: vi.fn(),
    updateExam: vi.fn(),
    deleteExam: vi.fn(),
  };
});

vi.mock('@/services/question.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/question.service')>();
  return {
    ...actual,
    getQuestionsByMockExamId: vi.fn(),
    linkUnlinkedQuestionsToExam: vi.fn(),
  };
});

const mockExamA: ExamListItem = {
  id: 'exam-1',
  title: 'Simulado ENEM | Janeiro - 2021',
  origin: 'ENEM',
  imageUrl: null,
  totalQuestions: 75,
  status: 'PUBLISHED',
  days: [{ day: 1, totalQuestions: 75 }],
};

const mockExamB: ExamListItem = {
  id: 'exam-2',
  title: 'Simulado Vestibular UFPR',
  origin: 'UFPR',
  imageUrl: null,
  totalQuestions: 50,
  status: 'DRAFT',
  days: [{ day: 1, totalQuestions: 50 }],
};

describe('ExamsPage', () => {
  beforeEach(() => {
    vi.mocked(examService.getExams).mockResolvedValue([mockExamA, mockExamB]);
    vi.mocked(questionService.getQuestionsByMockExamId).mockResolvedValue([
      {
        id: 'q-1',
        discipline: 'Matemática',
        content: 'Álgebra',
        question: 'Qual é o valor de x?',
        mockExamId: 'exam-1',
        enable: true,
        year: 2024,
        bank: 'ENEM',
      },
    ]);
    vi.mocked(questionService.linkUnlinkedQuestionsToExam).mockResolvedValue(0);
  });

  it('deve renderizar o título e a descrição da página', async () => {
    render(<ExamsPage />);

    expect(screen.getByRole('heading', { name: 'Gestão de Simulados' })).toBeInTheDocument();
    expect(
      screen.getByText('Organize as trilhas de aprendizado e a ordem das questões')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });
  });

  it('deve exibir a busca e o select de origens', () => {
    render(<ExamsPage />);

    expect(screen.getByPlaceholderText('Buscar simulados...')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Todas as origens' })).toBeInTheDocument();
  });

  it('deve filtrar simulados pelo título na busca', async () => {
    render(<ExamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar simulados...'), {
      target: { value: 'UFPR' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Simulado ENEM | Janeiro - 2021')).not.toBeInTheDocument();
      expect(screen.getByText('Simulado Vestibular UFPR')).toBeInTheDocument();
    });
  });

  it('deve filtrar simulados pela origem no select', async () => {
    render(<ExamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Simulado Vestibular UFPR')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ENEM' } });

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
      expect(screen.queryByText('Simulado Vestibular UFPR')).not.toBeInTheDocument();
    });
  });

  it('deve abrir o sheet de edição com dados preenchidos ao clicar em editar', async () => {
    render(<ExamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: 'Editar simulado' });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Editar Simulado' })).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ENEM')).toBeInTheDocument();
  });

  it('deve carregar e exibir questões ao expandir o simulado', async () => {
    render(<ExamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button', { name: 'Expandir' });
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(questionService.getQuestionsByMockExamId).toHaveBeenCalledWith('exam-1', {
        expectedCount: 75,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Qual é o valor de x?')).toBeInTheDocument();
    });
  });

  it('deve excluir o simulado e removê-lo da lista', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(examService.deleteExam).mockResolvedValue();

    render(<ExamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir simulado' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(examService.deleteExam).toHaveBeenCalledWith('exam-1');
    });

    await waitFor(() => {
      expect(screen.queryByText('Simulado ENEM | Janeiro - 2021')).not.toBeInTheDocument();
      expect(screen.getByText('Simulado Vestibular UFPR')).toBeInTheDocument();
    });
  });
});
