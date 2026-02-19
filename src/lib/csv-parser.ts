import Papa from 'papaparse';
import type { Transaction } from './types';

export function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = results.data.map((row: any, i: number) => {
            const sender = row.sender || row.from || row.source || row.from_account || row.sender_account;
            const receiver = row.receiver || row.to || row.target || row.to_account || row.receiver_account;
            const amount = parseFloat(row.amount || row.value || '0');
            const timestampStr = row.timestamp || row.date || row.time || row.created_at;
            const timestamp = timestampStr ? new Date(timestampStr) : new Date();

            if (!sender || !receiver) {
              throw new Error(`Row ${i + 1}: Missing sender or receiver column`);
            }

            return {
              id: `txn-${i}`,
              sender: String(sender).trim(),
              receiver: String(receiver).trim(),
              amount: isNaN(amount) ? 0 : amount,
              timestamp,
            };
          });
          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
