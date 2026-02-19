export interface Transaction {
  sender: string;
  receiver: string;
  amount: number;
  timestamp: Date;
  id: string;
}

export interface GraphNode {
  id: string;
  label: string;
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  suspicionScore: number;
  patterns: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  id: string;
}

export interface FraudRing {
  id: string;
  type: 'cycle' | 'smurfing' | 'layering';
  nodes: string[];
  edges: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  totalAmount: number;
}

export interface AnalysisResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  fraudRings: FraudRing[];
  summary: {
    totalTransactions: number;
    totalAccounts: number;
    suspiciousAccounts: number;
    fraudRingsDetected: number;
    totalSuspiciousAmount: number;
  };
}
