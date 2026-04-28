import { useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ImportQuestionsResponse } from '@/types/question.types';

type ImportQuestionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<ImportQuestionsResponse>;
  onImportSuccess?: () => Promise<void> | void;
};

const acceptedFileTypes = '.csv,.xlsx,.xls';

export function ImportQuestionsSheet({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportQuestionsSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetState = () => {
    setSelectedFile(null);
    setIsSubmitting(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }

    onOpenChange(nextOpen);
  };

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

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage('Selecione um arquivo antes de importar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      setSuccessMessage('Importação realizada com sucesso.');

      if (onImportSuccess) {
        await onImportSuccess();
      }
    } catch (error) {
      console.error('Erro ao importar questões:', error);
      setErrorMessage('Não foi possível importar o arquivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="center" className="max-w-2xl p-0">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>Importar questões</SheetTitle>
          <SheetDescription>
            Envie um arquivo CSV ou Excel para importar questões em lote.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6">
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
        </div>

        <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>

          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Importando...' : 'Importar arquivo'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
