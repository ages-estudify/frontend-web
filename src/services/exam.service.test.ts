import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/services/api';
import { deleteExam, getExams, importExam, updateExam } from '@/services/exam.service';
import type { ExamsApiResponse } from '@/types/exam.types';

describe('exam.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getExams filtra simulados com status ARCHIVED', async () => {
    const response: ExamsApiResponse = {
      data: [
        {
          id: 'exam-1',
          title: 'Publicado',
          origin: 'ENEM',
          imageUrl: null,
          totalQuestions: 10,
          status: 'PUBLISHED',
          days: [{ day: 1, totalQuestions: 10 }],
        },
        {
          id: 'exam-2',
          title: 'Arquivado',
          origin: 'ENEM',
          imageUrl: null,
          totalQuestions: 5,
          status: 'ARCHIVED',
          days: [{ day: 1, totalQuestions: 5 }],
        },
      ],
    };

    vi.spyOn(api, 'get').mockResolvedValue(response);

    const exams = await getExams();

    expect(api.get).toHaveBeenCalledWith('/admin/exams');
    expect(exams).toHaveLength(1);
    expect(exams[0].id).toBe('exam-1');
  });

  it('importExam envia arquivo CSV via multipart/form-data', async () => {
    const importResponse = {
      success: true,
      data: {
        examId: 'exam-new',
        status: 'DRAFT',
        daysCreated: 1,
        importedQuestions: 3,
        failed: 0,
        errors: [],
      },
    };

    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(importResponse);

    const file = new File(['conteudo'], 'simulado.csv', { type: 'text/csv' });
    const result = await importExam(file);

    expect(result).toEqual(importResponse);
    expect(postSpy).toHaveBeenCalledTimes(1);

    const [path, body, config] = postSpy.mock.calls[0];
    expect(path).toBe('/admin/exams/import');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect(config).toMatchObject({
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('updateExam só envia campos preenchidos no FormData', async () => {
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      success: true,
      data: {
        id: 'exam-1',
        title: 'Novo título',
        origin: 'ENEM',
        imageUrl: null,
        status: 'PUBLISHED',
      },
    });

    const image = new File(['img'], 'logo.png', { type: 'image/png' });
    await updateExam('exam-1', { title: 'Novo título', image });

    expect(putSpy).toHaveBeenCalledTimes(1);
    const [path, body] = putSpy.mock.calls[0];
    expect(path).toBe('/admin/exams/exam-1');
    const formData = body as FormData;
    expect(formData.get('title')).toBe('Novo título');
    expect(formData.get('image')).toBe(image);
    expect(formData.get('origin')).toBeNull();
  });

  it('deleteExam chama DELETE em /admin/exams/:id', async () => {
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue(undefined);

    await deleteExam('exam-1');

    expect(deleteSpy).toHaveBeenCalledWith('/admin/exams/exam-1');
  });

  it('updateExam suporta envio só de origin sem image', async () => {
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      success: true,
      data: {
        id: 'exam-1',
        title: 'Mantido',
        origin: 'UFRGS',
        imageUrl: null,
        status: 'DRAFT',
      },
    });

    await updateExam('exam-1', { origin: 'UFRGS' });

    const [, body] = putSpy.mock.calls[0];
    const formData = body as FormData;
    expect(formData.get('origin')).toBe('UFRGS');
    expect(formData.get('title')).toBeNull();
    expect(formData.get('image')).toBeNull();
  });

  it('propaga erro quando getExams falha', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('falha de rede'));

    await expect(getExams()).rejects.toThrow('falha de rede');
  });

  it('propaga erro quando importExam falha', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('importação falhou'));

    const file = new File(['x'], 'a.csv', { type: 'text/csv' });
    await expect(importExam(file)).rejects.toThrow('importação falhou');
  });

  it('propaga erro quando deleteExam falha', async () => {
    vi.spyOn(api, 'delete').mockRejectedValue(new Error('não encontrado'));

    await expect(deleteExam('exam-1')).rejects.toThrow('não encontrado');
  });

  it('propaga erro quando updateExam falha', async () => {
    vi.spyOn(api, 'put').mockRejectedValue(new Error('payload inválido'));

    await expect(updateExam('exam-1', { title: 't' })).rejects.toThrow('payload inválido');
  });
});
