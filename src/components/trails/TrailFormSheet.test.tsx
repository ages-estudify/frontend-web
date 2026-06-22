import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TrailFormSheet } from './TrailFormSheet';

const subjectOptions = [
  { id: 'subject-math', name: 'Matemática' },
  { id: 'subject-portuguese', name: 'Português' },
];

describe('TrailFormSheet', () => {
  it('valida campos obrigatórios antes de submeter', async () => {
    const onSubmit = vi.fn();

    render(
      <TrailFormSheet
        open
        mode="create"
        subjectOptions={subjectOptions}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));

    await waitFor(() => {
      expect(screen.getByText('Informe o nome da trilha.')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma disciplina.')).toBeInTheDocument();
      expect(screen.getByText('Informe uma ordem válida.')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia payload correto no modo create usando subjectId do select', async () => {
    const onSubmit = vi.fn();

    render(
      <TrailFormSheet
        open
        mode="create"
        subjectOptions={subjectOptions}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Álgebra'), {
      target: { value: ' Álgebra ' },
    });
    fireEvent.change(screen.getByPlaceholderText('Resumo do conteúdo trabalhado nesta trilha'), {
      target: { value: ' Equações ' },
    });
    fireEvent.change(screen.getByPlaceholderText('1'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Selecionar disciplina'), {
      target: { value: 'subject-math' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Álgebra',
        text: 'Equações',
        icon: '',
        order: 2,
        subjectId: 'subject-math',
      });
    });
  });

  it('converte imagem selecionada em base64 e envia no campo image', async () => {
    const onSubmit = vi.fn();

    render(
      <TrailFormSheet
        open
        mode="create"
        subjectOptions={subjectOptions}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Álgebra'), {
      target: { value: 'Álgebra' },
    });
    fireEvent.change(screen.getByPlaceholderText('1'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Selecionar disciplina'), {
      target: { value: 'subject-math' },
    });

    const file = new File(['conteudo-da-imagem'], 'icone.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Selecionar ícone da trilha'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('icone.png')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Álgebra',
          subjectId: 'subject-math',
          icon: expect.stringMatching(/^data:image\/png;base64,/),
        })
      );
    });
  });

  it('preenche campos no modo edit e exibe o nome da disciplina no select', () => {
    render(
      <TrailFormSheet
        open
        mode="edit"
        subjectOptions={subjectOptions}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialValues={{
          name: 'Geometria',
          text: 'Figuras planas',
          iconUrl: 'https://cdn/geo.svg',
          order: '3',
          subjectId: 'subject-math',
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Editar Trilha' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Geometria')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Figuras planas')).toBeInTheDocument();
    expect(screen.getByAltText('Ícone da trilha')).toHaveAttribute('src', 'https://cdn/geo.svg');
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByLabelText('Selecionar disciplina')).toHaveValue('subject-math');
    expect(screen.getByRole('option', { name: 'Matemática' })).toBeInTheDocument();
  });

  it('fecha ao clicar em cancelar sem submeter', () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TrailFormSheet
        open
        mode="create"
        subjectOptions={subjectOptions}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('exibe submitError e desabilita submit quando isSubmitting', () => {
    render(
      <TrailFormSheet
        open
        mode="create"
        subjectOptions={subjectOptions}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        submitError="Falha grave"
        isSubmitting
      />
    );

    expect(screen.getByText('Falha grave')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
  });

  it('exibe select desabilitado enquanto disciplinas carregam', () => {
    render(
      <TrailFormSheet
        open
        mode="create"
        subjectOptions={[]}
        isLoadingSubjects
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Selecionar disciplina')).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Carregando disciplinas...' })).toBeInTheDocument();
  });
});
