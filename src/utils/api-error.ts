export function formatApiError(error: unknown, fallback: string): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = record.message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }

    if (typeof record.error === 'string') {
      return record.error;
    }
  }

  return fallback;
}
