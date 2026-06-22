import api, { handleApiError } from './api';
import { getQuestionPaths } from './question.service';
import type { QuestionPath } from '@/types/question.types';
import type { Trail, TrailPayload, TrailQuestion } from '@/types/trail.types';

const TOPICS_BASE_PATH = '/admin/topics';
const QUESTIONS_BASE_PATH = '/admin/questions';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (!isRecord(response)) {
    return [];
  }

  if (Array.isArray(response.data)) {
    return response.data as T[];
  }

  if (Array.isArray(response.content)) {
    return response.content as T[];
  }

  if (isRecord(response.data)) {
    if (Array.isArray(response.data.content)) {
      return response.data.content as T[];
    }

    if (Array.isArray(response.data.data)) {
      return response.data.data as T[];
    }
  }

  return [];
}

function normalizeObjectResponse<T>(response: unknown): T {
  if (isRecord(response) && isRecord(response.data)) {
    return response.data as T;
  }

  return response as T;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeTrailQuestion(item: unknown, index: number): TrailQuestion | null {
  if (!isRecord(item)) {
    return null;
  }

  const id = optionalString(item.id) ?? `question-${index + 1}`;
  const title =
    optionalString(item.question) ?? optionalString(item.text) ?? `Questão ${index + 1}`;

  return {
    id,
    title,
    discipline: optionalString(item.discipline),
    content: optionalString(item.content),
    year: optionalNumber(item.year),
    enable: optionalBoolean(item.enable),
  };
}

export const getTrails = async (): Promise<Trail[]> => {
  try {
    const response = await api.get(TOPICS_BASE_PATH);
    return normalizeArrayResponse<Trail>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const createTrail = async (payload: TrailPayload): Promise<Trail> => {
  try {
    const response = await api.post(TOPICS_BASE_PATH, payload);
    return normalizeObjectResponse<Trail>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateTrail = async (id: string, payload: TrailPayload): Promise<Trail> => {
  try {
    const response = await api.put(`${TOPICS_BASE_PATH}/${id}`, payload);
    return normalizeObjectResponse<Trail>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteTrail = async (id: string): Promise<void> => {
  try {
    await api.delete(`${TOPICS_BASE_PATH}/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getTrailQuestions = async (topicId: string): Promise<TrailQuestion[]> => {
  try {
    const response = await api.get(QUESTIONS_BASE_PATH, {
      params: { topicId },
    });

    return normalizeArrayResponse<unknown>(response)
      .map((item, index) => normalizeTrailQuestion(item, index))
      .filter((item): item is TrailQuestion => item !== null);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getTrailQuestionPaths = async (): Promise<QuestionPath[]> => {
  return getQuestionPaths();
};
