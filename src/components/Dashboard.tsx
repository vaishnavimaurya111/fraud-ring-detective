import { useState, useCallback } from 'react';
import { Shield, Download, Activity, Users, AlertTriangle, DollarSign } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import NetworkGraph from '@/components/NetworkGraph';
import FraudTable from '@/components/FraudTable';
import SuspicionTable from '@/components/SuspicionTable';
import { analyzeTransactions } from '@/lib/detection-engine';
import type { Transaction, AnalysisResult } from '@/lib/types';

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${accent ? 'border-primary/40 glow-border' : 'border-border'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${accent ? 'text-primary glow-text' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleData = useCallback((transactions: Transaction[]) => {
    setIsLoading(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const analysisResult = analyzeTransactions(transactions);
      setResult(analysisResult);
      setIsLoading(false);
    }, 100);
  }, []);

  const handleExport = useCallback(() => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleLoadSample = useCallback(() => {
    const sampleTransactions: Transaction[] = [
      { id: 'txn-0', sender: 'Alice', receiver: 'Bob', amount: 5000, timestamp: new Date('2024-01-15T10:00:00') },
      { id: 'txn-1', sender: 'Bob', receiver: 'Charlie', amount: 4800, timestamp: new Date('2024-01-15T11:30:00') },
      { id: 'txn-2', sender: 'Charlie', receiver: 'Alice', amount: 4600, timestamp: new Date('2024-01-15T14:00:00') },
      { id: 'txn-3', sender: 'Dave', receiver: 'Eve', amount: 10000, timestamp: new Date('2024-01-16T09:00:00') },
      { id: 'txn-4', sender: 'Frank', receiver: 'Eve', amount: 9500, timestamp: new Date('2024-01-16T09:30:00') },
      { id: 'txn-5', sender: 'Grace', receiver: 'Eve', amount: 8700, timestamp: new Date('2024-01-16T10:00:00') },
      { id: 'txn-6', sender: 'Hank', receiver: 'Eve', amount: 9200, timestamp: new Date('2024-01-16T10:30:00') },
      { id: 'txn-7', sender: 'Eve', receiver: 'Ivan', amount: 35000, timestamp: new Date('2024-01-16T12:00:00') },
      { id: 'txn-8', sender: 'Ivan', receiver: 'Judy', amount: 34000, timestamp: new Date('2024-01-17T08:00:00') },
      { id: 'txn-9', sender: 'Judy', receiver: 'Karl', amount: 33000, timestamp: new Date('2024-01-17T14:00:00') },
      { id: 'txn-10', sender: 'Karl', receiver: 'Liam', amount: 32000, timestamp: new Date('2024-01-18T09:00:00') },
      { id: 'txn-11', sender: 'Alice', receiver: 'Dave', amount: 2000, timestamp: new Date('2024-01-18T10:00:00') },
      { id: 'txn-12', sender: 'Dave', receiver: 'Bob', amount: 1800, timestamp: new Date('2024-01-18T11:00:00') },
    ];
    handleData(sampleTransactions);
  }, [handleData]);

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">FRAUD DETECT</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Network Analysis Engine
              </p>
            </div>
          </div>
          {result && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-muted hover:bg-muted/80 text-sm font-mono text-foreground transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {!result ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground glow-text">Transaction Analysis</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Upload a CSV of financial transactions to detect circular flows, smurfing patterns, and layered shell structures.
              </p>
            </div>
            <FileUpload onDataLoaded={handleData} isLoading={isLoading} />
            <button
              onClick={handleLoadSample}
              className="text-xs font-mono text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
            >
              Load sample dataset
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard icon={Activity} label="Transactions" value={result.summary.totalTransactions} />
              <StatCard icon={Users} label="Accounts" value={result.summary.totalAccounts} />
              <StatCard icon={AlertTriangle} label="Suspicious" value={result.summary.suspiciousAccounts} accent />
              <StatCard icon={Shield} label="Fraud Rings" value={result.summary.fraudRingsDetected} accent />
              <StatCard icon={DollarSign} label="Flagged Amt" value={`$${result.summary.totalSuspiciousAmount.toLocaleString()}`} accent />
            </div>

            {/* Graph */}
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Network Visualization
              </h2>
              <NetworkGraph result={result} />
            </div>

            {/* Tables */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Detected Fraud Rings
                </h2>
                <FraudTable result={result} />
              </div>
              <div>
                <SuspicionTable result={result} />
              </div>
            </div>

            {/* Upload new */}
            <div className="pt-4 border-t border-border">
              <FileUpload onDataLoaded={handleData} isLoading={isLoading} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
