import { describe, expect, it } from 'vitest';
import { formatApiError } from '@/utils/api-error';

describe('formatApiError', () => {
  it('returns string errors as-is', () => {
    expect(formatApiError('falha', 'fallback')).toBe('falha');
  });

  it('returns message field when present', () => {
    expect(formatApiError({ message: 'campo inválido' }, 'fallback')).toBe('campo inválido');
  });

  it('joins array messages', () => {
    expect(formatApiError({ message: ['a', 'b'] }, 'fallback')).toBe('a, b');
  });

  it('returns error field when message is missing', () => {
    expect(formatApiError({ error: 'não autorizado' }, 'fallback')).toBe('não autorizado');
  });

  it('returns fallback for unknown shapes', () => {
    expect(formatApiError(null, 'fallback')).toBe('fallback');
  });
});
