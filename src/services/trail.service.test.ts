import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/services/api';
import {
  createTrail,
  deleteTrail,
  getTrailQuestions,
  getTrails,
  getTrailQuestionPaths,
  updateTrail,
} from '@/services/trail.service';
import type { Trail, TrailPayload } from '@/types/trail.types';

const sampleTrail: Trail = {
  id: 'topic-1',
  name: 'Álgebra',
  text: 'Equações e funções',
  iconUrl: 'https://cdn/icon.svg',
  order: 1,
  subjectId: 'subject-math',
};

const payload: TrailPayload = {
  name: 'Álgebra',
  text: 'Equações e funções',
  icon: 'https://cdn/icon.svg',
  order: 1,
  subjectId: 'subject-math',
};

describe('trail.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getTrails chama GET /admin/topics e normaliza data', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [sampleTrail] });

    const result = await getTrails();

    expect(api.get).toHaveBeenCalledWith('/admin/topics');
    expect(result).toEqual([sampleTrail]);
  });

  it('getTrails normaliza array cru, data.content, data.data e resposta inválida', async () => {
    const getSpy = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce([sampleTrail])
      .mockResolvedValueOnce({ data: { content: [sampleTrail] } })
      .mockResolvedValueOnce({ data: { data: [sampleTrail] } })
      .mockResolvedValueOnce(null);

    await expect(getTrails()).resolves.toEqual([sampleTrail]);
    await expect(getTrails()).resolves.toEqual([sampleTrail]);
    await expect(getTrails()).resolves.toEqual([sampleTrail]);
    await expect(getTrails()).resolves.toEqual([]);
    expect(getSpy).toHaveBeenCalledTimes(4);
  });

  it('createTrail chama POST /admin/topics com o payload oficial', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: sampleTrail });

    const result = await createTrail(payload);

    expect(api.post).toHaveBeenCalledWith('/admin/topics', payload);
    expect(result).toEqual(sampleTrail);
  });

  it('createTrail aceita resposta sem wrapper data', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(sampleTrail);

    const result = await createTrail(payload);

    expect(result).toEqual(sampleTrail);
  });

  it('updateTrail chama PUT /admin/topics/:id com o payload oficial', async () => {
    vi.spyOn(api, 'put').mockResolvedValue({ data: sampleTrail });

    const result = await updateTrail('topic-1', payload);

    expect(api.put).toHaveBeenCalledWith('/admin/topics/topic-1', payload);
    expect(result).toEqual(sampleTrail);
  });

  it('deleteTrail chama DELETE /admin/topics/:id', async () => {
    vi.spyOn(api, 'delete').mockResolvedValue(undefined);

    await deleteTrail('topic-1');

    expect(api.delete).toHaveBeenCalledWith('/admin/topics/topic-1');
  });

  it('getTrailQuestions chama GET /admin/questions com topicId e normaliza content', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      content: [
        {
          id: 'q-1',
          question: 'Qual é o valor de x?',
          discipline: 'Matemática',
          content: 'Álgebra',
          year: 2024,
          enable: true,
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
    });

    const result = await getTrailQuestions('topic-1');

    expect(api.get).toHaveBeenCalledWith('/admin/questions', {
      params: { topicId: 'topic-1' },
    });
    expect(result).toEqual([
      {
        id: 'q-1',
        title: 'Qual é o valor de x?',
        discipline: 'Matemática',
        content: 'Álgebra',
        year: 2024,
        enable: true,
      },
    ]);
  });

  it('getTrailQuestionPaths delega para getQuestionPaths real', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: [
        {
          id: 'path-algebra',
          name: 'Álgebra',
          text: '',
          icon_url: '',
          schedule_position: 0,
          trail_position: 1,
          subject_id: 'subject-math',
          subject: { id: 'subject-math', name: 'Matemática', icon_url: '' },
        },
      ],
    });

    const result = await getTrailQuestionPaths();

    expect(api.get).toHaveBeenCalledWith('/admin/questions/paths');
    expect(result).toHaveLength(1);
    expect(result[0].subject.name).toBe('Matemática');
  });

  it('getTrailQuestions normaliza text, id gerado, título padrão e ano em string', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        content: [
          {
            text: 'Questão por text',
            year: '2023',
            enable: false,
          },
          {
            id: 'q-2',
            year: 'ano inválido',
          },
          'linha inválida',
        ],
      },
    });

    const result = await getTrailQuestions('topic-1');

    expect(result).toEqual([
      {
        id: 'question-1',
        title: 'Questão por text',
        discipline: undefined,
        content: undefined,
        year: 2023,
        enable: false,
      },
      {
        id: 'q-2',
        title: 'Questão 2',
        discipline: undefined,
        content: undefined,
        year: undefined,
        enable: undefined,
      },
    ]);
  });

  it('propaga erro quando createTrail falha', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('falha ao criar'));

    await expect(createTrail(payload)).rejects.toThrow('falha ao criar');
  });

  it('propaga erro quando updateTrail falha', async () => {
    vi.spyOn(api, 'put').mockRejectedValue(new Error('falha ao editar'));

    await expect(updateTrail('topic-1', payload)).rejects.toThrow('falha ao editar');
  });

  it('propaga erro quando deleteTrail falha', async () => {
    vi.spyOn(api, 'delete').mockRejectedValue(new Error('falha ao excluir'));

    await expect(deleteTrail('topic-1')).rejects.toThrow('falha ao excluir');
  });

  it('propaga erro quando getTrailQuestions falha', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('falha ao buscar questões'));

    await expect(getTrailQuestions('topic-1')).rejects.toThrow('falha ao buscar questões');
  });

  it('propaga erro quando a listagem falha', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('falha de rede'));

    await expect(getTrails()).rejects.toThrow('falha de rede');
  });
});
