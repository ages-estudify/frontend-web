import api, { handleApiError } from './api';
import { readFileAsBase64 } from '@/utils/file.utils';
import type {
  ExamListItem,
  ExamsApiResponse,
  ImportExamResponse,
  UpdateExamPayload,
  UpdateExamResponse,
} from '@/types/exam.types';

const EXAMS_BASE_PATH = '/exams';

/** Simulados excluídos (soft delete) voltam da API com status ARCHIVED — ocultamos no front. */
export const getExams = async (): Promise<ExamListItem[]> => {
  try {
    const response = (await api.get(EXAMS_BASE_PATH)) as ExamsApiResponse;
    return response.data.filter((exam) => exam.status !== 'ARCHIVED');
  } catch (error) {
    return handleApiError(error);
  }
};

/** POST /admin/exams/import — apenas arquivo CSV (metadados + questões no CSV). */
export const importExam = async (file: File): Promise<ImportExamResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    return (await api.post(`${EXAMS_BASE_PATH}/admin/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as ImportExamResponse;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateExam = async (
  id: string,
  payload: UpdateExamPayload
): Promise<UpdateExamResponse> => {
  try {
    const body: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      body.title = payload.title;
    }

    if (payload.origin !== undefined) {
      body.origin = payload.origin;
    }

    if (payload.image !== undefined && payload.image !== null) {
      if (payload.image instanceof File) {
        body.image = await readFileAsBase64(payload.image);
      } else {
        body.image = payload.image;
      }
    }

    return (await api.put(`${EXAMS_BASE_PATH}/admin/${id}`, body)) as UpdateExamResponse;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteExam = async (id: string): Promise<void> => {
  try {
    await api.delete(`${EXAMS_BASE_PATH}/admin/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
};
