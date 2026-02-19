import type { Transaction, GraphNode, GraphEdge, FraudRing, AnalysisResult } from './types';

function buildAdjacency(transactions: Transaction[]): Map<string, { to: string; amount: number; timestamp: Date; id: string }[]> {
  const adj = new Map<string, { to: string; amount: number; timestamp: Date; id: string }[]>();
  for (const txn of transactions) {
    if (!adj.has(txn.sender)) adj.set(txn.sender, []);
    adj.get(txn.sender)!.push({ to: txn.receiver, amount: txn.amount, timestamp: txn.timestamp, id: txn.id });
  }
  return adj;
}

function detectCycles(adj: Map<string, { to: string; amount: number; timestamp: Date; id: string }[]>, minLen = 3, maxLen = 5): FraudRing[] {
  const rings: FraudRing[] = [];
  const visited = new Set<string>();
  const nodes = Array.from(adj.keys());

  for (const start of nodes) {
    const stack: { node: string; path: string[]; edges: string[]; amount: number }[] = [
      { node: start, path: [start], edges: [], amount: 0 },
    ];

    while (stack.length > 0) {
      const { node, path, edges, amount } = stack.pop()!;
      const neighbors = adj.get(node) || [];

      for (const edge of neighbors) {
        if (edge.to === start && path.length >= minLen) {
          const ringKey = [...path].sort().join('-');
          if (!visited.has(ringKey)) {
            visited.add(ringKey);
            rings.push({
              id: `cycle-${rings.length}`,
              type: 'cycle',
              nodes: [...path],
              edges: [...edges, edge.id],
              description: `Circular flow detected: ${path.join(' → ')} → ${start}`,
              severity: path.length >= 4 ? 'critical' : 'high',
              totalAmount: amount + edge.amount,
            });
          }
        } else if (!path.includes(edge.to) && path.length < maxLen) {
          stack.push({
            node: edge.to,
            path: [...path, edge.to],
            edges: [...edges, edge.id],
            amount: amount + edge.amount,
          });
        }
      }
    }
  }
  return rings;
}

function detectSmurfing(transactions: Transaction[], windowHours = 72): FraudRing[] {
  const rings: FraudRing[] = [];
  const byReceiver = new Map<string, Transaction[]>();
  const bySender = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    if (!byReceiver.has(txn.receiver)) byReceiver.set(txn.receiver, []);
    byReceiver.get(txn.receiver)!.push(txn);
    if (!bySender.has(txn.sender)) bySender.set(txn.sender, []);
    bySender.get(txn.sender)!.push(txn);
  }

  // Fan-in: many senders → one receiver within window
  for (const [receiver, txns] of byReceiver) {
    if (txns.length < 3) continue;
    const sorted = txns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < sorted.length; i++) {
      const windowEnd = sorted[i].timestamp.getTime() + windowHours * 3600000;
      const windowTxns = sorted.filter(t => t.timestamp.getTime() >= sorted[i].timestamp.getTime() && t.timestamp.getTime() <= windowEnd);
      const uniqueSenders = new Set(windowTxns.map(t => t.sender));
      if (uniqueSenders.size >= 3) {
        const nodeSet = [receiver, ...uniqueSenders];
        rings.push({
          id: `smurf-in-${rings.length}`,
          type: 'smurfing',
          nodes: nodeSet,
          edges: windowTxns.map(t => t.id),
          description: `Fan-in: ${uniqueSenders.size} accounts → ${receiver} within ${windowHours}h`,
          severity: uniqueSenders.size >= 5 ? 'critical' : 'high',
          totalAmount: windowTxns.reduce((s, t) => s + t.amount, 0),
        });
        break;
      }
    }
  }

  // Fan-out: one sender → many receivers within window
  for (const [sender, txns] of bySender) {
    if (txns.length < 3) continue;
    const sorted = txns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < sorted.length; i++) {
      const windowEnd = sorted[i].timestamp.getTime() + windowHours * 3600000;
      const windowTxns = sorted.filter(t => t.timestamp.getTime() >= sorted[i].timestamp.getTime() && t.timestamp.getTime() <= windowEnd);
      const uniqueReceivers = new Set(windowTxns.map(t => t.receiver));
      if (uniqueReceivers.size >= 3) {
        const nodeSet = [sender, ...uniqueReceivers];
        rings.push({
          id: `smurf-out-${rings.length}`,
          type: 'smurfing',
          nodes: nodeSet,
          edges: windowTxns.map(t => t.id),
          description: `Fan-out: ${sender} → ${uniqueReceivers.size} accounts within ${windowHours}h`,
          severity: uniqueReceivers.size >= 5 ? 'critical' : 'high',
          totalAmount: windowTxns.reduce((s, t) => s + t.amount, 0),
        });
        break;
      }
    }
  }

  return rings;
}

function detectLayering(adj: Map<string, { to: string; amount: number; timestamp: Date; id: string }[]>, minHops = 3): FraudRing[] {
  const rings: FraudRing[] = [];
  const nodes = Array.from(adj.keys());

  for (const start of nodes) {
    const stack: { node: string; path: string[]; edges: string[]; amount: number }[] = [
      { node: start, path: [start], edges: [], amount: 0 },
    ];

    while (stack.length > 0) {
      const { node, path, edges, amount } = stack.pop()!;
      const neighbors = adj.get(node) || [];

      if (path.length >= minHops + 1) {
        rings.push({
          id: `layer-${rings.length}`,
          type: 'layering',
          nodes: [...path],
          edges: [...edges],
          description: `${path.length - 1}-hop chain: ${path.join(' → ')}`,
          severity: path.length >= 5 ? 'critical' : path.length >= 4 ? 'high' : 'medium',
          totalAmount: amount,
        });
        continue;
      }

      for (const edge of neighbors) {
        if (!path.includes(edge.to)) {
          stack.push({
            node: edge.to,
            path: [...path, edge.to],
            edges: [...edges, edge.id],
            amount: amount + edge.amount,
          });
        }
      }
    }
  }

  // Deduplicate: keep longest chains
  const seen = new Set<string>();
  return rings.filter(r => {
    const key = r.nodes.join('-');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 50); // limit
}

function computeScores(
  nodeMap: Map<string, GraphNode>,
  fraudRings: FraudRing[]
): void {
  const weights = { cycle: 40, smurfing: 30, layering: 20 };

  for (const ring of fraudRings) {
    const score = weights[ring.type] * (ring.severity === 'critical' ? 1.5 : ring.severity === 'high' ? 1.2 : 1);
    for (const nodeId of ring.nodes) {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.suspicionScore += score;
        if (!node.patterns.includes(ring.type)) {
          node.patterns.push(ring.type);
        }
      }
    }
  }

  // Normalize to 0-100
  const maxScore = Math.max(...Array.from(nodeMap.values()).map(n => n.suspicionScore), 1);
  for (const node of nodeMap.values()) {
    node.suspicionScore = Math.round((node.suspicionScore / maxScore) * 100);
  }
}

export function analyzeTransactions(transactions: Transaction[]): AnalysisResult {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  // Build nodes & edges
  for (const txn of transactions) {
    for (const id of [txn.sender, txn.receiver]) {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id, label: id,
          totalSent: 0, totalReceived: 0,
          transactionCount: 0, suspicionScore: 0, patterns: [],
        });
      }
    }
    nodeMap.get(txn.sender)!.totalSent += txn.amount;
    nodeMap.get(txn.sender)!.transactionCount++;
    nodeMap.get(txn.receiver)!.totalReceived += txn.amount;
    nodeMap.get(txn.receiver)!.transactionCount++;

    edges.push({
      from: txn.sender, to: txn.receiver,
      amount: txn.amount, timestamp: txn.timestamp, id: txn.id,
    });
  }

  const adj = buildAdjacency(transactions);
  const cycles = detectCycles(adj);
  const smurfing = detectSmurfing(transactions);
  const layering = detectLayering(adj);
  const fraudRings = [...cycles, ...smurfing, ...layering];

  computeScores(nodeMap, fraudRings);

  const nodes = Array.from(nodeMap.values()).sort((a, b) => b.suspicionScore - a.suspicionScore);
  const suspiciousAccounts = nodes.filter(n => n.suspicionScore > 30).length;

  return {
    nodes,
    edges,
    fraudRings,
    summary: {
      totalTransactions: transactions.length,
      totalAccounts: nodes.length,
      suspiciousAccounts,
      fraudRingsDetected: fraudRings.length,
      totalSuspiciousAmount: fraudRings.reduce((s, r) => s + r.totalAmount, 0),
    },
  };
}
