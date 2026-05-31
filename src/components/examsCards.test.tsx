import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExamCard, type ExamCardQuestion } from './examsCards';

const defaultLabels = {
  expand: 'Expandir',
  collapse: 'Recolher',
  questionsTitle: 'Questões neste simulado:',
  editAriaLabel: 'Editar simulado',
  deleteAriaLabel: 'Excluir simulado',
};

const sampleQuestions: ExamCardQuestion[] = [
  { id: 'q-1', title: 'Questão 1' },
  { id: 'q-2', title: 'Questão 2' },
];

describe('ExamCard', () => {
  it('alterna entre expandir e recolher e dispara onExpandChange', () => {
    const onExpandChange = vi.fn();

    render(
      <ExamCard
        logoSrc="/logo.svg"
        logoAlt="logo"
        title="Simulado X"
        metadata={['10 questões', 'ENEM']}
        questions={sampleQuestions}
        labels={defaultLabels}
        onExpandChange={onExpandChange}
      />
    );

    expect(screen.queryByText('Questão 1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));

    expect(onExpandChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Questão 1')).toBeInTheDocument();
    expect(screen.getByText('Questão 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recolher' }));
    expect(onExpandChange).toHaveBeenLastCalledWith(false);
  });

  it('não renderiza botões de adicionar ou excluir questão (somente leitura)', () => {
    render(
      <ExamCard
        logoSrc="/logo.svg"
        logoAlt="logo"
        title="Simulado X"
        metadata={['10 questões']}
        questions={sampleQuestions}
        labels={defaultLabels}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));

    expect(screen.queryByRole('button', { name: /Adicionar Questão/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir questão/i })).not.toBeInTheDocument();
  });

  it('exibe estado de carregamento de questões', () => {
    render(
      <ExamCard
        logoSrc="/logo.svg"
        logoAlt="logo"
        title="Simulado X"
        metadata={['10 questões']}
        questions={[]}
        isLoadingQuestions
        labels={defaultLabels}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));
    expect(screen.getByText('Carregando questões...')).toBeInTheDocument();
  });

  it('renderiza com isDeleting desabilitando o botão de excluir', () => {
    render(
      <ExamCard
        logoSrc="/logo.svg"
        logoAlt="logo"
        title="Simulado X"
        metadata={['10 questões']}
        questions={[]}
        isDeleting
        labels={defaultLabels}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Excluir simulado' })).toBeDisabled();
  });

  it('exibe estado vazio quando não há questões', () => {
    render(
      <ExamCard
        logoSrc="/logo.svg"
        logoAlt="logo"
        title="Simulado X"
        metadata={['0 questões']}
        questions={[]}
        labels={defaultLabels}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));
    expect(screen.getByText('Nenhuma questão neste simulado.')).toBeInTheDocument();
  });

  it('substitui a imagem pelo logo padrão quando ocorre erro de carregamento', () => {
    render(
      <ExamCard
        logoSrc="https://cdn/quebrada.png"
        logoAlt="logo"
        title="Simulado X"
        metadata={['10 questões']}
        questions={[]}
        labels={defaultLabels}
      />
    );

    const img = screen.getByAltText('logo') as HTMLImageElement;
    expect(img.src).toContain('cdn/quebrada.png');

    fireEvent.error(img);
    expect(img.src).toContain('/enem-logo.svg');

    fireEvent.error(img);
    expect(img.src).toContain('/enem-logo.svg');
  });

  it('chama onEdit e onDelete ao clicar nas ações do cabeçalho', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ExamCard
        logoSrc="/logo.svg"
        logoAlt="logo"
        title="Simulado X"
        metadata={['10 questões']}
        questions={[]}
        labels={defaultLabels}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar simulado' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir simulado' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
