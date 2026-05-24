import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExamFormSheet } from './ExamFormSheet';

beforeEach(() => {
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  }
});

describe('ExamFormSheet', () => {
  it('no modo create exige arquivo CSV antes do submit', async () => {
    const onSubmit = vi.fn();

    render(<ExamFormSheet open mode="create" onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar Simulado' }));

    await waitFor(() => {
      expect(
        screen.getByText('Selecione um arquivo CSV para importar o simulado.')
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no modo create envia documentFile e imageFile quando selecionados', async () => {
    const onSubmit = vi.fn();

    render(<ExamFormSheet open mode="create" onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    const csvFile = new File(['exam_title\nSimulado'], 'simulado.csv', { type: 'text/csv' });
    const imageFile = new File(['img'], 'logo.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Selecionar arquivo CSV do simulado'), {
      target: { files: [csvFile] },
    });

    fireEvent.change(screen.getByLabelText('Selecionar imagem do simulado'), {
      target: { files: [imageFile] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Simulado' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: '',
      origin: '',
      day: '1',
      imageFile,
      documentFile: csvFile,
    });
  });

  it('no modo edit preenche campos a partir dos initialValues', () => {
    render(
      <ExamFormSheet
        open
        mode="edit"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialValues={{
          name: 'Simulado X',
          origin: 'ENEM',
          day: '1',
          imageFile: null,
          documentFile: null,
          imageUrl: 'https://cdn/example.png',
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Editar Simulado' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Simulado X')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ENEM')).toBeInTheDocument();
    expect(screen.getByAltText('Imagem do simulado')).toHaveAttribute(
      'src',
      'https://cdn/example.png'
    );
  });

  it('submit no modo edit envia name, origin e imageFile', async () => {
    const onSubmit = vi.fn();
    const newImage = new File(['img'], 'novo.png', { type: 'image/png' });

    render(
      <ExamFormSheet
        open
        mode="edit"
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        initialValues={{
          name: 'Antigo',
          origin: 'UFRGS',
          day: '1',
          imageFile: null,
          documentFile: null,
          imageUrl: null,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText('Selecionar imagem do simulado'), {
      target: { files: [newImage] },
    });

    fireEvent.change(screen.getByDisplayValue('Antigo'), {
      target: { value: 'Atualizado' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Atualizado',
          origin: 'UFRGS',
          imageFile: newImage,
          documentFile: null,
        })
      );
    });
  });

  it('aceita drop de arquivo CSV no modo create', async () => {
    const onSubmit = vi.fn();

    render(<ExamFormSheet open mode="create" onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    const csvFile = new File(['conteudo'], 'simulado.csv', { type: 'text/csv' });
    const dropZone = screen.getByText('Arraste seu arquivo aqui').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [csvFile] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Simulado' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ documentFile: csvFile }));
    });
  });

  it('troca o preview ao escolher uma nova imagem', () => {
    render(
      <ExamFormSheet
        open
        mode="edit"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialValues={{
          name: 'Antigo',
          origin: 'UFRGS',
          day: '1',
          imageFile: null,
          documentFile: null,
          imageUrl: 'https://cdn/old.png',
        }}
      />
    );

    expect(screen.getByAltText('Imagem do simulado')).toHaveAttribute('src', 'https://cdn/old.png');

    const newImage = new File(['img'], 'novo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Selecionar imagem do simulado'), {
      target: { files: [newImage] },
    });

    const secondImage = new File(['img2'], 'segundo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Selecionar imagem do simulado'), {
      target: { files: [secondImage] },
    });

    expect(screen.getByAltText('Imagem do simulado')).toBeInTheDocument();
  });

  it('exibe submitError quando recebido', () => {
    render(
      <ExamFormSheet
        open
        mode="create"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        submitError="Falha grave"
      />
    );

    expect(screen.getByText('Falha grave')).toBeInTheDocument();
  });

  it('botão de submit fica desabilitado enquanto isSubmitting', () => {
    render(
      <ExamFormSheet open mode="create" onOpenChange={vi.fn()} onSubmit={vi.fn()} isSubmitting />
    );

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
  });

  it('Cancelar fecha o sheet sem submeter', () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();

    render(<ExamFormSheet open mode="create" onOpenChange={onOpenChange} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
