import { describe, expect, it } from 'vitest';
import { readFileAsBase64 } from '@/utils/file.utils';

describe('readFileAsBase64', () => {
  it('converte arquivo para base64', async () => {
    const file = new File(['conteudo'], 'arquivo.txt', { type: 'text/plain' });

    await expect(readFileAsBase64(file)).resolves.toMatch(/^data:text\/plain;base64,/);
  });

  it('rejeita quando FileReader retorna valor inválido', async () => {
    const file = new File(['conteudo'], 'arquivo.txt', { type: 'text/plain' });
    const original = globalThis.FileReader;

    class InvalidResultReader {
      result: ArrayBuffer | null = null;
      error: DOMException | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        this.onload?.();
      }
    }

    globalThis.FileReader = InvalidResultReader as unknown as typeof FileReader;

    try {
      await expect(readFileAsBase64(file)).rejects.toThrow('Falha ao ler arquivo');
    } finally {
      globalThis.FileReader = original;
    }
  });
});
