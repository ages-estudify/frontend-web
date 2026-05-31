import { describe, expect, it } from 'vitest';

import { joinQuestionText, splitQuestionText } from '@/components/questions/question-text.utils';

describe('question-text.utils', () => {
  it('preenche título e enunciado com o mesmo texto quando não há separador', () => {
    expect(splitQuestionText('Qual civilização construiu as pirâmides?')).toEqual({
      title: 'Qual civilização construiu as pirâmides?',
      statement: 'Qual civilização construiu as pirâmides?',
    });
  });

  it('separa título e enunciado quando há dupla quebra de linha', () => {
    expect(splitQuestionText('Título curto\n\nTexto completo do enunciado.')).toEqual({
      title: 'Título curto',
      statement: 'Texto completo do enunciado.',
    });
  });

  it('não duplica conteúdo ao salvar título e enunciado iguais', () => {
    expect(joinQuestionText('Mesmo texto', 'Mesmo texto')).toBe('Mesmo texto');
  });

  it('mantém título e enunciado distintos ao salvar', () => {
    expect(joinQuestionText('Título', 'Enunciado longo')).toBe('Título\n\nEnunciado longo');
  });
});
