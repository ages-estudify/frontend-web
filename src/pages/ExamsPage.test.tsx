import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as examService from '@/services/exam.service';
import * as questionService from '@/services/question.service';
import type { ExamListItem } from '@/types/exam.types';
import type { AdminQuestion } from '@/types/question.types';

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

  it('deve salvar alterações de título via updateExam no modo edit', async () => {
    vi.mocked(examService.updateExam).mockResolvedValue({
      success: true,
      data: {
        id: 'exam-1',
        title: 'Novo Título',
        origin: 'ENEM',
        imageUrl: null,
        status: 'PUBLISHED',
      },
    });

    render(<ExamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar simulado' })[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Simulado ENEM | Janeiro - 2021'), {
      target: { value: 'Novo Título' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(examService.updateExam).toHaveBeenCalledWith(
        'exam-1',
        expect.objectContaining({ title: 'Novo Título', origin: 'ENEM' })
      );
    });
  });

  it('não exclui o simulado se window.confirm for cancelado', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ExamsPage />);

    await waitFor(() => {
      expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir simulado' })[0]);

    expect(examService.deleteExam).not.toHaveBeenCalled();
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

  describe('fluxo de importação de simulado', () => {
    const csvContent = `exam_title,bank,exam_day,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,year
Simulado Novo,ENEM,1,Matemática,Álgebra,Qual é o valor de x?,1,2,3,4,5,C,Explicação,2024`;

    const importedQuestion: AdminQuestion = {
      id: 'q-new-1',
      discipline: 'Matemática',
      content: 'Álgebra',
      question: 'Qual é o valor de x?',
      mockExamId: 'exam-new',
      enable: true,
      year: 2024,
      bank: 'ENEM',
    };

    beforeEach(() => {
      vi.mocked(examService.importExam).mockResolvedValue({
        success: true,
        data: {
          examId: 'exam-new',
          status: 'DRAFT',
          daysCreated: 1,
          importedQuestions: 1,
          failed: 0,
          errors: [],
        },
      });

      vi.mocked(examService.updateExam).mockResolvedValue({
        success: true,
        data: {
          id: 'exam-new',
          title: 'Simulado Novo',
          origin: 'ENEM',
          imageUrl: null,
          status: 'PUBLISHED',
        },
      });

      vi.mocked(questionService.getQuestionsByMockExamId).mockResolvedValue([importedQuestion]);
      vi.mocked(questionService.linkUnlinkedQuestionsToExam).mockResolvedValue(1);

      if (typeof URL.createObjectURL !== 'function') {
        URL.createObjectURL = vi.fn(() => 'blob:mock');
        URL.revokeObjectURL = vi.fn();
      }
    });

    it('importa o CSV, faz upload da imagem e abre o modal de revisão', async () => {
      render(<ExamsPage />);

      await waitFor(() => {
        expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '+ Novo Simulado' }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Novo Simulado' })).toBeInTheDocument();
      });

      const csvFile = new File([csvContent], 'simulado.csv', { type: 'text/csv' });
      const imageFile = new File(['img'], 'logo.png', { type: 'image/png' });

      fireEvent.change(screen.getByLabelText('Selecionar arquivo CSV do simulado'), {
        target: { files: [csvFile] },
      });
      fireEvent.change(screen.getByLabelText('Selecionar imagem do simulado'), {
        target: { files: [imageFile] },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Criar Simulado' }));

      await waitFor(() => {
        expect(examService.importExam).toHaveBeenCalledWith(csvFile);
      });

      await waitFor(() => {
        expect(questionService.linkUnlinkedQuestionsToExam).toHaveBeenCalledWith('exam-new', 1);
      });

      await waitFor(() => {
        expect(examService.updateExam).toHaveBeenCalledWith('exam-new', { image: imageFile });
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Revisão de Importação' })).toBeInTheDocument();
      });

      expect(screen.getByText('Qual é o valor de x?')).toBeInTheDocument();
    });

    it('mostra erro quando o CSV não importa nenhuma questão', async () => {
      vi.mocked(examService.importExam).mockResolvedValue({
        success: true,
        data: {
          examId: 'exam-new',
          status: 'DRAFT',
          daysCreated: 0,
          importedQuestions: 0,
          failed: 1,
          errors: [{ line: 2, error: 'Disciplina não encontrada' }],
        },
      });

      render(<ExamsPage />);

      await waitFor(() => {
        expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '+ Novo Simulado' }));

      const csvFile = new File([csvContent], 'simulado.csv', { type: 'text/csv' });
      fireEvent.change(screen.getByLabelText('Selecionar arquivo CSV do simulado'), {
        target: { files: [csvFile] },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Criar Simulado' }));

      await waitFor(() => {
        expect(screen.getByText(/Linha 2: Disciplina não encontrada/i)).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('heading', { name: 'Revisão de Importação' })
      ).not.toBeInTheDocument();
    });

    it('fechar a revisão pelo botão Concluído recarrega a lista', async () => {
      render(<ExamsPage />);

      await waitFor(() => {
        expect(screen.getByText('Simulado ENEM | Janeiro - 2021')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '+ Novo Simulado' }));

      const csvFile = new File([csvContent], 'simulado.csv', { type: 'text/csv' });
      fireEvent.change(screen.getByLabelText('Selecionar arquivo CSV do simulado'), {
        target: { files: [csvFile] },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Criar Simulado' }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Revisão de Importação' })).toBeInTheDocument();
      });

      const getExamsCallsBefore = vi.mocked(examService.getExams).mock.calls.length;
      fireEvent.click(screen.getByRole('button', { name: 'Concluído' }));

      await waitFor(() => {
        expect(vi.mocked(examService.getExams).mock.calls.length).toBeGreaterThan(
          getExamsCallsBefore
        );
      });

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Revisão de Importação' })
        ).not.toBeInTheDocument();
      });
    });
  });
});
