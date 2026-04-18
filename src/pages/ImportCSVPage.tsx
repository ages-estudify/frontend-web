import { useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { importQuestions } from '@/services/question.service';

const acceptedFileTypes = '.csv,.xlsx,.xls';

const csvExampleHeaders = [
  'discipline',
  'content',
  'question',
  'alternative_a',
  'alternative_b',
  'alternative_c',
  'alternative_d',
  'alternative_e',
  'correct_answer',
  'answer_explanation',
  'bank',
  'year',
  'mock_exam_id',
];

export function ImportCSVPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setErrorMessage('');
    setSuccessMessage('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isValidExtension =
      file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isValidExtension) {
      setSelectedFile(null);
      setErrorMessage('Selecione um arquivo CSV ou Excel válido.');
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Selecione um arquivo antes de importar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      await importQuestions(selectedFile);
      setSuccessMessage('Importação realizada com sucesso.');
      setSelectedFile(null);
    } catch (error) {
      console.error('Erro ao importar questões:', error);
      setErrorMessage('Não foi possível importar o arquivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Importar CSV</h1>
        <p className="text-sm text-muted-foreground">
          Envie um arquivo CSV ou Excel para importar questões em lote.
        </p>
      </header>

      <section className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8">
            <label
              htmlFor="questions-import-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  Clique para selecionar um arquivo
                </p>
                <p className="text-xs text-muted-foreground">Formatos aceitos: CSV, XLSX ou XLS</p>
              </div>

              <input
                id="questions-import-file"
                type="file"
                accept={acceptedFileTypes}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {selectedFile ? (
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <Button type="button" variant="ghost" size="icon-sm" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Estrutura esperada do CSV</p>
            <p className="mb-3 text-xs text-muted-foreground">
              O arquivo deve conter as colunas abaixo na primeira linha.
            </p>

            <div className="flex flex-wrap gap-2">
              {csvExampleHeaders.map((header) => (
                <span
                  key={header}
                  className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
                >
                  {header}
                </span>
              ))}
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleRemoveFile}>
              Limpar
            </Button>

            <Button type="button" onClick={handleImport} disabled={isSubmitting}>
              {isSubmitting ? 'Importando...' : 'Importar arquivo'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
