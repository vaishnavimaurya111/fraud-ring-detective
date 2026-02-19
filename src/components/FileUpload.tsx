import { useCallback, useState } from 'react';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { parseCSV } from '@/lib/csv-parser';
import type { Transaction } from '@/lib/types';

interface FileUploadProps {
  onDataLoaded: (transactions: Transaction[]) => void;
  isLoading: boolean;
}

export default function FileUpload({ onDataLoaded, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    setError(null);
    setFileName(file.name);
    try {
      const transactions = await parseCSV(file);
      if (transactions.length === 0) {
        setError('No valid transactions found in CSV');
        return;
      }
      onDataLoaded(transactions);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV');
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        className={`relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-primary bg-primary/5 glow-border'
            : 'border-border hover:border-primary/50 bg-card'
        } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-3">
          {fileName ? (
            <FileText className="w-10 h-10 text-primary" />
          ) : (
            <Upload className="w-10 h-10 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {fileName || 'Drop CSV file here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Required columns: sender, receiver, amount, timestamp
            </p>
          </div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-primary font-mono">Analyzing...</span>
          </div>
        )}
      </label>
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive font-mono">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
