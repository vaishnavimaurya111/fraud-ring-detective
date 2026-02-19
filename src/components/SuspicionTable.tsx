import type { AnalysisResult } from '@/lib/types';

interface SuspicionTableProps {
  result: AnalysisResult;
}

export default function SuspicionTable({ result }: SuspicionTableProps) {
  const topNodes = result.nodes.filter(n => n.suspicionScore > 0).slice(0, 20);

  if (topNodes.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden glow-border">
      <div className="p-3 border-b border-border bg-muted/30">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Top Suspicious Accounts
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-mono text-xs text-muted-foreground">Account</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground">Score</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground">Sent</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground">Received</th>
              <th className="text-left p-3 font-mono text-xs text-muted-foreground">Patterns</th>
            </tr>
          </thead>
          <tbody>
            {topNodes.map(node => (
              <tr key={node.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono text-xs text-foreground">{node.label}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${node.suspicionScore}%`,
                          backgroundColor: node.suspicionScore >= 70
                            ? 'hsl(0, 72%, 51%)'
                            : node.suspicionScore >= 40
                            ? 'hsl(45, 93%, 47%)'
                            : 'hsl(175, 80%, 50%)',
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-foreground">{node.suspicionScore}</span>
                  </div>
                </td>
                <td className="p-3 font-mono text-xs text-foreground">${node.totalSent.toLocaleString()}</td>
                <td className="p-3 font-mono text-xs text-foreground">${node.totalReceived.toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {node.patterns.map(p => (
                      <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-primary/10 text-primary border border-primary/20">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
