import api, { handleApiError } from './api';
import type {
  CreateQuestionPayload,
  ImportQuestionsResponse,
  QuestionByIdApiResponse,
  QuestionExam,
  QuestionExamsApiResponse,
  QuestionPath,
  QuestionPathsApiResponse,
  QuestionsApiResponse,
  QuestionsFilters,
  QuestionsListResponse,
  UpdateQuestionPayload,
} from '@/types/question.types';

const QUESTIONS_BASE_PATH = '/admin/questions';

const buildQuestionsParams = (filters?: QuestionsFilters) => {
  if (!filters) return {};

  return {
    path_id: filters.path_id || undefined,
    exam_id: filters.exam_id || undefined,
    origin: filters.origin || undefined,
    year: filters.year || undefined,
    page: filters.page ?? 0,
    size: filters.size ?? 20,
  };
};

export const getQuestions = async (filters?: QuestionsFilters): Promise<QuestionsListResponse> => {
  try {
    const response = (await api.get(QUESTIONS_BASE_PATH, {
      params: buildQuestionsParams(filters),
    })) as QuestionsApiResponse;

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionById = async (id: string) => {
  try {
    const response = await api.get<QuestionByIdApiResponse>(`${QUESTIONS_BASE_PATH}/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionPaths = async (): Promise<QuestionPath[]> => {
  try {
    const response = (await api.get(`${QUESTIONS_BASE_PATH}/paths`)) as QuestionPathsApiResponse;
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionExams = async (): Promise<QuestionExam[]> => {
  try {
    const response = (await api.get(`${QUESTIONS_BASE_PATH}/exams`)) as QuestionExamsApiResponse;
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createQuestion = async (payload: CreateQuestionPayload): Promise<void> => {
  try {
    await api.post(QUESTIONS_BASE_PATH, payload);
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
