import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initialQuestionFormState } from '@/components/questions/question-form.constants';
import { QuestionFormSheet } from '@/components/questions/QuestionFormSheet';
import * as questionService from '@/services/question.service';
import type {
  CreateQuestionPayload,
  QuestionFormData,
  QuestionPath,
  UpdateQuestionPayload,
} from '@/types/question.types';

type QuestionFormOnSubmit = (
  payload: CreateQuestionPayload | UpdateQuestionPayload
) => void | Promise<void>;

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="sheet-content" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/services/question.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/question.service')>();
  return {
    ...actual,
    getQuestionPaths: vi.fn(),
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

function QuestionFormSheetHarness({
  mode = 'create',
  initialFormData = initialQuestionFormState,
  requireOrder = false,
  onOpenChange = vi.fn(),
  onSubmit = vi.fn().mockResolvedValue(undefined) as QuestionFormOnSubmit,
}: {
  mode?: 'create' | 'edit';
  initialFormData?: QuestionFormData;
  requireOrder?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: QuestionFormOnSubmit;
}) {
  const [formData, setFormData] = useState(initialFormData);

  return (
    <QuestionFormSheet
      open
      onOpenChange={onOpenChange}
      mode={mode}
      formData={formData}
      setFormData={setFormData}
      requireOrder={requireOrder}
      onSubmit={onSubmit}
    />
  );
}

describe('QuestionFormSheet', () => {
  beforeEach(() => {
    vi.mocked(questionService.getQuestionPaths).mockResolvedValue([mockPath]);
  });

  it('deve exibir o título conforme o modo (criar ou editar)', () => {
    const { rerender } = render(<QuestionFormSheetHarness mode="create" />);

    expect(screen.getByRole('heading', { name: 'Nova Questão' })).toBeInTheDocument();

    rerender(<QuestionFormSheetHarness mode="edit" />);

    expect(screen.getByRole('heading', { name: 'Editar Questão' })).toBeInTheDocument();
  });

  it('deve carregar matérias ao abrir e listar a matéria retornada pela API', async () => {
    render(<QuestionFormSheetHarness />);

    await waitFor(() => {
      expect(questionService.getQuestionPaths).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Matemática' })).toBeInTheDocument();
    });
  });

  it('deve exibir erros de validação ao enviar o formulário vazio', async () => {
    const onSubmitMock = vi.fn();
    render(<QuestionFormSheetHarness onSubmit={onSubmitMock as QuestionFormOnSubmit} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando matérias...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Questão' }));

    await waitFor(() => {
      expect(screen.getAllByText('Informe o enunciado da questão.').length).toBeGreaterThan(0);
      expect(screen.getByText('Informe o título da questão.')).toBeInTheDocument();
    });

    expect(screen.queryByText('Informe a ordem.')).not.toBeInTheDocument();
    expect(screen.getByText('Informe a alternativa A.')).toBeInTheDocument();
    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('deve exibir aviso de ordem opcional na gestão de questões', async () => {
    render(<QuestionFormSheetHarness />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando matérias...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/A ordem ainda não é salva pelo servidor/i)).toBeInTheDocument();
    expect(screen.getByText('Ordem (opcional)')).toBeInTheDocument();
  });

  it('deve exigir ordem quando requireOrder está ativo', async () => {
    const onSubmitMock = vi.fn();
    render(
      <QuestionFormSheetHarness requireOrder onSubmit={onSubmitMock as QuestionFormOnSubmit} />
    );

    await waitFor(() => {
      expect(screen.queryByText('Carregando matérias...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Questão' }));

    await waitFor(() => {
      expect(screen.getByText('Informe a ordem.')).toBeInTheDocument();
    });
  });

  it('deve permitir salvar sem ordem na gestão quando os demais campos estão preenchidos', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    render(<QuestionFormSheetHarness onSubmit={onSubmitMock as QuestionFormOnSubmit} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando matérias...')).not.toBeInTheDocument();
    });

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[0], { target: { value: 'sub-1' } });
    fireEvent.change(comboboxes[2], { target: { value: 'path-1' } });

    fireEvent.change(screen.getByPlaceholderText('Ex: Interpretação de Texto - Machado de Assis'), {
      target: { value: 'Título' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite o enunciado completo da questão...'), {
      target: { value: 'Enunciado' },
    });
    fireEvent.change(screen.getByPlaceholderText('Alternativa A'), { target: { value: 'Alt A' } });
    fireEvent.change(screen.getByPlaceholderText('Alternativa B'), { target: { value: 'Alt B' } });
    fireEvent.change(screen.getByPlaceholderText('Alternativa C'), { target: { value: 'Alt C' } });
    fireEvent.change(screen.getByPlaceholderText('Alternativa D'), { target: { value: 'Alt D' } });
    fireEvent.change(screen.getByPlaceholderText('Alternativa E'), { target: { value: 'Alt E' } });

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Questão' }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });
  });

  it('deve chamar onSubmit com payload válido quando o formulário está preenchido', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    render(<QuestionFormSheetHarness onSubmit={onSubmitMock as QuestionFormOnSubmit} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando matérias...')).not.toBeInTheDocument();
    });

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[0], { target: { value: 'sub-1' } });
    fireEvent.change(comboboxes[2], { target: { value: 'path-1' } });

    fireEvent.change(screen.getByPlaceholderText('Ex: Interpretação de Texto - Machado de Assis'), {
      target: { value: 'Título da questão' },
    });

    fireEvent.change(screen.getByPlaceholderText('Digite o enunciado completo da questão...'), {
      target: { value: 'Enunciado completo da questão' },
    });

    fireEvent.change(screen.getByPlaceholderText('12'), {
      target: { value: '10' },
    });

    fireEvent.change(screen.getByPlaceholderText('Alternativa A'), {
      target: { value: 'Alt A' },
    });
    fireEvent.change(screen.getByPlaceholderText('Alternativa B'), {
      target: { value: 'Alt B' },
    });
    fireEvent.change(screen.getByPlaceholderText('Alternativa C'), {
      target: { value: 'Alt C' },
    });
    fireEvent.change(screen.getByPlaceholderText('Alternativa D'), {
      target: { value: 'Alt D' },
    });
    fireEvent.change(screen.getByPlaceholderText('Alternativa E'), {
      target: { value: 'Alt E' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'B' }));

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Questão' }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmitMock.mock.calls[0][0] as {
      path_id: string;
      text: string;
      alternatives: { letter: string; is_correct: boolean }[];
    };

    expect(payload.path_id).toBe('path-1');
    expect(payload.text).toBe('Título da questão\n\nEnunciado completo da questão');
    expect(payload.alternatives.find((a) => a.letter === 'B')?.is_correct).toBe(true);
    expect(payload.alternatives.find((a) => a.letter === 'A')?.is_correct).toBe(false);
  });

  it('deve chamar onOpenChange(false) ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn();
    render(<QuestionFormSheetHarness onOpenChange={onOpenChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando matérias...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('deve preencher título e enunciado quando o texto não tem separador', async () => {
    render(
      <QuestionFormSheetHarness
        initialFormData={{
          ...initialQuestionFormState,
          text: 'Qual civilização construiu as pirâmides de Gizé?',
        }}
      />
    );

    await waitFor(() => {
      expect(
        screen.getAllByDisplayValue('Qual civilização construiu as pirâmides de Gizé?')
      ).toHaveLength(2);
    });
  });

  it('deve exibir o rótulo do botão de envio no modo edição', async () => {
    render(
      <QuestionFormSheetHarness
        mode="edit"
        initialFormData={{
          ...initialQuestionFormState,
          path_id: 'path-1',
          text: 'Enunciado',
          number: '1',
          alternativeA: 'a',
          alternativeB: 'b',
          alternativeC: 'c',
          alternativeD: 'd',
          alternativeE: 'e',
        }}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Carregando matérias...')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument();
  });
});
