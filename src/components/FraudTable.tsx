import type { AnalysisResult } from '@/lib/types';
import { Shield, AlertTriangle, Zap } from 'lucide-react';

interface FraudTableProps {
  result: AnalysisResult;
}

const severityColors: Record<string, string> = {
  critical: 'text-destructive',
  high: 'text-warning',
  medium: 'text-primary',
  low: 'text-muted-foreground',
};

const typeIcons: Record<string, typeof Shield> = {
  cycle: Shield,
  smurfing: Zap,
  layering: AlertTriangle,
};

export default function FraudTable({ result }: FraudTableProps) {
  if (result.fraudRings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Shield className="w-10 h-10 text-success mx-auto mb-3" />
        <p className="text-foreground font-medium">No fraud rings detected</p>
        <p className="text-sm text-muted-foreground mt-1">All transactions appear clean</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden glow-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Severity</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Nodes</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody>
            {result.fraudRings.map((ring) => {
              const Icon = typeIcons[ring.type] || Shield;
              return (
                <tr key={ring.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs uppercase text-foreground">{ring.type}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`font-mono text-xs uppercase font-semibold ${severityColors[ring.severity]}`}>
                      {ring.severity}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-foreground">{ring.nodes.length}</td>
                  <td className="p-3 font-mono text-xs text-foreground">
                    ${ring.totalAmount.toLocaleString()}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                    {ring.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
