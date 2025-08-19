export interface CreditRequest {
  id: string;
  cifCode: string;
  occupation: string;
  monthlyIncome: number;
  cartTypeId: string;
  status: string;
  fullname: string;
  email: string;
  reason?: string;
  accountNumber: string;
  identityNumber: string;
  dateOfBirth: string;
  phoneNumber?: string;
} 