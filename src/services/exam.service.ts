import api, { handleApiError } from './api';
import type {
  ExamListItem,
  ExamsApiResponse,
  ImportExamResponse,
  UpdateExamPayload,
  UpdateExamResponse,
} from '@/types/exam.types';

const EXAMS_BASE_PATH = '/admin/exams';

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

    return (await api.post(`${EXAMS_BASE_PATH}/import`, formData, {
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
    const formData = new FormData();

    if (payload.title !== undefined) {
      formData.append('title', payload.title);
    }

    if (payload.origin !== undefined) {
      formData.append('origin', payload.origin);
    }

    if (payload.image) {
      formData.append('image', payload.image);
    }

    return (await api.put(`${EXAMS_BASE_PATH}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as UpdateExamResponse;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteExam = async (id: string): Promise<void> => {
  try {
    await api.delete(`${EXAMS_BASE_PATH}/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
};
