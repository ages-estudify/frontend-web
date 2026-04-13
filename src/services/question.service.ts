import api, { handleApiError } from './api';
import type {
  CreateQuestionPayload,
  CreateQuestionResponse,
  ImportQuestionsResponse,
  QuestionsFilters,
  QuestionsListResponse,
  UpdateQuestionPayload,
} from '@/types/question.types';

const QUESTIONS_BASE_PATH = '/admin/questions';

const buildQuestionsParams = (filters?: QuestionsFilters) => {
  if (!filters) return {};

  return {
    discipline: filters.discipline || undefined,
    content: filters.content || undefined,
    type: filters.type || undefined,
    year: filters.year || undefined,
    mockExamId: filters.mockExamId || undefined,
    page: filters.page ?? 0,
    size: filters.size ?? 20,
  };
};

export const getQuestions = async (filters?: QuestionsFilters): Promise<QuestionsListResponse> => {
  try {
    return await api.get(QUESTIONS_BASE_PATH, {
      params: buildQuestionsParams(filters),
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionsByMockExamId = async (
  mockExamId: string,
  filters?: Omit<QuestionsFilters, 'mockExamId'>
): Promise<QuestionsListResponse> => {
  try {
    return await api.get(QUESTIONS_BASE_PATH, {
      params: buildQuestionsParams({
        ...filters,
        mockExamId,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const createQuestion = async (
  payload: CreateQuestionPayload
): Promise<CreateQuestionResponse> => {
  try {
    return await api.post(QUESTIONS_BASE_PATH, payload);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateQuestion = async (id: string, payload: UpdateQuestionPayload): Promise<void> => {
  try {
    await api.put(`${QUESTIONS_BASE_PATH}/${id}`, payload);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    await api.delete(`${QUESTIONS_BASE_PATH}/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
};

export const importQuestions = async (file: File): Promise<ImportQuestionsResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    return await api.post(`${QUESTIONS_BASE_PATH}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
