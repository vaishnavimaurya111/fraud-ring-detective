import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import type { AnalysisResult } from '@/lib/types';

interface NetworkGraphProps {
  result: AnalysisResult;
}

export default function NetworkGraph({ result }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const suspiciousNodes = new Set(
      result.fraudRings.flatMap(r => r.nodes)
    );

    const nodes = new DataSet(
      result.nodes.map(node => {
        const score = node.suspicionScore;
        const isSuspicious = suspiciousNodes.has(node.id);
        let color: string;
        if (score >= 70) color = '#ef4444';
        else if (score >= 40) color = '#eab308';
        else if (isSuspicious) color = '#f97316';
        else color = '#22d3ee';

        return {
          id: node.id,
          label: `${node.label}\n[${score}]`,
          color: {
            background: color,
            border: color,
            highlight: { background: '#ffffff', border: color },
          },
          font: {
            color: '#e2e8f0',
            size: 11,
            face: 'JetBrains Mono, monospace',
          },
          size: 12 + Math.min(node.transactionCount * 3, 25),
          borderWidth: isSuspicious ? 3 : 1,
          shadow: isSuspicious ? { enabled: true, color: color, size: 15, x: 0, y: 0 } : false,
        };
      })
    );

    const fraudEdgeIds = new Set(result.fraudRings.flatMap(r => r.edges));

    const edges = new DataSet(
      result.edges.map((edge, i) => ({
        id: `edge-${i}`,
        from: edge.from,
        to: edge.to,
        arrows: 'to',
        color: {
          color: fraudEdgeIds.has(edge.id) ? '#ef4444' : '#334155',
          highlight: '#22d3ee',
        },
        width: fraudEdgeIds.has(edge.id) ? 2.5 : 1,
        smooth: { type: 'curvedCW', roundness: 0.2 },
        font: {
          color: '#64748b',
          size: 9,
          face: 'JetBrains Mono, monospace',
          strokeWidth: 0,
        },
        label: `$${edge.amount.toLocaleString()}`,
      }))
    );

    const network = new Network(containerRef.current, { nodes: nodes as any, edges: edges as any }, {
      physics: {
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.3,
          springLength: 120,
          damping: 0.09,
        },
        stabilization: { iterations: 150 },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
      },
      layout: { improvedLayout: true },
    });

    networkRef.current = network;
    return () => network.destroy();
  }, [result]);

  return (
    <div className="w-full h-[500px] rounded-lg border border-border bg-card overflow-hidden glow-border">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
