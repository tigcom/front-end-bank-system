import { Repayment } from './repayment.model';
import { LoanStatus } from "./loanStatus .model";
import { LoanRejectionReason } from "./LoanRejectionReason.model";
import { InfoIncome } from './infoIncome.model';
export interface Loan {
  loanId: number| null;
  customerId: number| null;
  disbursementAccountNumber: string;
  repaymentAccountNumber: string;
  amount: number;
  interestRate: number;
  declaredIncome: number | null;
  termMonths: number;
  status: LoanStatus | null;
  createdAt: string| null;
  approvedAt: string | null;
  repayments: Repayment[]|null;
  rejectionReasons: LoanRejectionReason[]|null;
  loanType?: string;
  pathFile?: string | null; 
}
