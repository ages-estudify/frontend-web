import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as trailService from '@/services/trail.service';
import type { QuestionPath } from '@/types/question.types';
import type { Trail, TrailPayload, TrailQuestion } from '@/types/trail.types';

import { TrailsPage } from './TrailsPage';

vi.mock('@/services/trail.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/trail.service')>();
  return {
    ...actual,
    getTrails: vi.fn(),
    createTrail: vi.fn(),
    updateTrail: vi.fn(),
    deleteTrail: vi.fn(),
    getTrailQuestions: vi.fn(),
    getTrailQuestionPaths: vi.fn(),
  };
});

const mockTrailA: Trail = {
  id: 'topic-1',
  name: 'Álgebra',
  text: 'Equações e funções',
  iconUrl: '',
  order: 1,
  subjectId: 'subject-math',
};

const mockTrailB: Trail = {
  id: 'topic-2',
  name: 'Geometria',
  text: 'Figuras planas',
  iconUrl: '',
  order: 2,
  subjectId: 'subject-math',
};

const createdTrail: Trail = {
  id: 'topic-3',
  name: 'Redação',
  text: 'Texto dissertativo',
  iconUrl: 'https://cdn/redacao.svg',
  order: 3,
  subjectId: 'subject-portuguese',
};

const mockQuestion: TrailQuestion = {
  id: 'q-1',
  title: 'Qual é o valor de x?',
  discipline: 'Matemática',
  content: 'Álgebra',
  year: 2024,
};

const mathPath: QuestionPath = {
  id: 'path-algebra',
  name: 'Álgebra',
  text: '',
  icon_url: '',
  schedule_position: 0,
  trail_position: 1,
  subject_id: 'subject-math',
  subject: { id: 'subject-math', name: 'Matemática', icon_url: '' },
};

const portuguesePath: QuestionPath = {
  id: 'path-redacao',
  name: 'Redação',
  text: '',
  icon_url: '',
  schedule_position: 0,
  trail_position: 1,
  subject_id: 'subject-portuguese',
  subject: { id: 'subject-portuguese', name: 'Português', icon_url: '' },
};

const createPayload: TrailPayload = {
  name: 'Redação',
  text: 'Texto dissertativo',
  icon: '',
  order: 3,
  subjectId: 'subject-portuguese',
};

async function fillCreateForm() {
  await screen.findByRole('option', { name: 'Português' });

  fireEvent.change(screen.getByPlaceholderText('Álgebra'), {
    target: { value: createPayload.name },
  });
  fireEvent.change(screen.getByPlaceholderText('Resumo do conteúdo trabalhado nesta trilha'), {
    target: { value: createPayload.text },
  });
  fireEvent.change(screen.getByPlaceholderText('1'), {
    target: { value: String(createPayload.order) },
  });
  fireEvent.change(screen.getByLabelText('Selecionar disciplina'), {
    target: { value: createPayload.subjectId },
  });
}

describe('TrailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(trailService.getTrails).mockResolvedValue([mockTrailA, mockTrailB]);
    vi.mocked(trailService.getTrailQuestionPaths).mockResolvedValue([mathPath, portuguesePath]);
    vi.mocked(trailService.createTrail).mockResolvedValue(createdTrail);
    vi.mocked(trailService.updateTrail).mockResolvedValue({
      ...mockTrailA,
      name: 'Álgebra Atualizada',
    });
    vi.mocked(trailService.deleteTrail).mockResolvedValue(undefined);
    vi.mocked(trailService.getTrailQuestions).mockResolvedValue([mockQuestion]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza a listagem de trilhas sem carregar questões no início', async () => {
    render(<TrailsPage />);

    expect(screen.getByRole('heading', { name: 'Gestão de Trilhas' })).toBeInTheDocument();
    expect(
      screen.getByText('Organize trilhas de aprendizado sem vincular questões automaticamente')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
      expect(screen.getByText('Geometria')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Questões: —/).length).toBeGreaterThanOrEqual(2);
    expect(trailService.getTrailQuestionPaths).toHaveBeenCalled();
    expect(trailService.getTrailQuestions).not.toHaveBeenCalled();
  });

  it('filtra trilhas pelo nome na busca', async () => {
    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar trilhas...'), {
      target: { value: 'geo' },
    });

    expect(screen.queryByText('Álgebra')).not.toBeInTheDocument();
    expect(screen.getByText('Geometria')).toBeInTheDocument();
  });

  it('exibe empty state quando não há trilhas', async () => {
    vi.mocked(trailService.getTrails).mockResolvedValueOnce([]);

    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma trilha encontrada.')).toBeInTheDocument();
    });
  });

  it('exibe loading enquanto carrega trilhas', async () => {
    let resolveTrails: (value: Trail[]) => void = () => {};
    const trailsPromise = new Promise<Trail[]>((resolve) => {
      resolveTrails = resolve;
    });
    vi.mocked(trailService.getTrails).mockReturnValueOnce(trailsPromise);

    render(<TrailsPage />);

    expect(screen.getByText('Carregando trilhas...')).toBeInTheDocument();

    resolveTrails([mockTrailA]);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });
  });

  it('exibe erro ao falhar a listagem', async () => {
    vi.mocked(trailService.getTrails).mockRejectedValueOnce({ message: 'Falha ao listar' });

    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Falha ao listar')).toBeInTheDocument();
    });
  });

  it('exibe erro ao falhar o carregamento de disciplinas', async () => {
    vi.mocked(trailService.getTrailQuestionPaths).mockRejectedValueOnce({
      message: 'Falha ao carregar disciplinas',
    });

    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar disciplinas')).toBeInTheDocument();
    });
  });

  it('cria trilha vazia com subjectId do select e atualiza a listagem', async () => {
    vi.mocked(trailService.getTrails)
      .mockResolvedValueOnce([mockTrailA, mockTrailB])
      .mockResolvedValueOnce([mockTrailA, mockTrailB, createdTrail]);
    vi.mocked(trailService.getTrailQuestions).mockResolvedValueOnce([]);

    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    const callsBeforeCreate = vi.mocked(trailService.getTrails).mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: '+ Nova Trilha' }));
    await fillCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));

    await waitFor(() => {
      expect(trailService.createTrail).toHaveBeenCalledWith(createPayload);
    });
    expect(trailService.getTrailQuestions).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(vi.mocked(trailService.getTrails).mock.calls.length).toBeGreaterThan(
        callsBeforeCreate
      );
    });
    expect(screen.getByText('Trilha criada com sucesso.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Redação')).toBeInTheDocument();
    });

    const createdSection = screen.getByText('Redação').closest('section');
    if (!createdSection) {
      throw new Error('Card da trilha recém-criada não encontrado.');
    }

    fireEvent.click(within(createdSection).getByRole('button', { name: 'Expandir' }));

    await waitFor(() => {
      expect(trailService.getTrailQuestions).toHaveBeenCalledWith('topic-3');
    });
    expect(screen.getByText(/0 questões/)).toBeInTheDocument();
  });

  it('valida campos obrigatórios antes de criar', async () => {
    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '+ Nova Trilha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));

    expect(screen.getByText('Informe o nome da trilha.')).toBeInTheDocument();
    expect(screen.getByText('Selecione uma disciplina.')).toBeInTheDocument();
    expect(screen.getByText('Informe uma ordem válida.')).toBeInTheDocument();
    expect(trailService.createTrail).not.toHaveBeenCalled();
  });

  it('abre edição com modal preenchido e salva payload editado', async () => {
    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar trilha' })[0]);

    expect(screen.getByRole('heading', { name: 'Editar Trilha' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Álgebra')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Equações e funções')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByLabelText('Selecionar disciplina')).toHaveValue('subject-math');
    expect(screen.getAllByRole('option', { name: 'Matemática' }).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByDisplayValue('Álgebra'), {
      target: { value: 'Álgebra Atualizada' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(trailService.updateTrail).toHaveBeenCalledWith(
        'topic-1',
        expect.objectContaining({ name: 'Álgebra Atualizada', order: 1, subjectId: 'subject-math' })
      );
    });
    expect(screen.getByText('Trilha atualizada com sucesso.')).toBeInTheDocument();
  });

  it('exclui trilha após confirmação e atualiza a listagem', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    const callsBeforeDelete = vi.mocked(trailService.getTrails).mock.calls.length;

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir trilha' })[0]);

    await waitFor(() => {
      expect(trailService.deleteTrail).toHaveBeenCalledWith('topic-1');
    });
    await waitFor(() => {
      expect(vi.mocked(trailService.getTrails).mock.calls.length).toBeGreaterThan(
        callsBeforeDelete
      );
    });
    expect(screen.getByText('Trilha excluída com sucesso.')).toBeInTheDocument();
  });

  it('não exclui trilha quando confirmação é cancelada', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir trilha' })[0]);

    expect(trailService.deleteTrail).not.toHaveBeenCalled();
  });

  it('carrega questões apenas ao expandir e reaproveita o cache ao recolher e expandir', async () => {
    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    expect(trailService.getTrailQuestions).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Expandir' })[0]);

    await waitFor(() => {
      expect(trailService.getTrailQuestions).toHaveBeenCalledWith('topic-1');
    });
    await waitFor(() => {
      expect(screen.getByText('Qual é o valor de x?')).toBeInTheDocument();
    });
    expect(screen.getByText(/1 questão/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recolher' }));
    expect(screen.queryByText('Qual é o valor de x?')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Expandir' })[0]);

    expect(trailService.getTrailQuestions).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Qual é o valor de x?')).toBeInTheDocument();
  });

  it('exibe erro ao falhar carregamento de questões da trilha', async () => {
    vi.mocked(trailService.getTrailQuestions).mockRejectedValueOnce({
      message: 'Falha ao carregar questões',
    });

    render(<TrailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Álgebra')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Expandir' })[0]);

    await waitFor(() => {
      expect(trailService.getTrailQuestions).toHaveBeenCalledWith('topic-1');
    });
    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar questões')).toBeInTheDocument();
    });
  });
});
