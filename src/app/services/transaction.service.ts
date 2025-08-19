import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private baseUrl = 'http://localhost:8888';
  private baseUrlTransaction = 'http://localhost:8888/api/transactions';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
  getAccountForCustomer(): Observable<any> {
    return this.http.get(
      `${this.baseUrlTransaction}/account/getAllPaymentAccount`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  getCurrentCustomer(): Observable<any> {
    return this.http.get(`${this.baseUrlTransaction}/customers/detail`, {
      headers: this.getAuthHeaders(),
    });
  }
  getListToAccountNumberTransactioLatest(
    accountNumber: string
  ): Observable<any> {
    return this.http.get(
      `${this.baseUrlTransaction}/get-latest-transaction/${accountNumber}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  getTransactionByReferenceCode(referenceCode: string): Observable<any> {
    return this.http.get(
      `${this.baseUrlTransaction}/getByReferenceCode/${referenceCode}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  // Create Transaction

  transfer(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrlTransaction}/transfer`, payload, {
      headers: this.getAuthHeaders(),
    });
  }
  // External Transfer
  externalTransfer(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrlTransaction}/external-transfer`,
      payload,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  // Resend OTP
  resendOtp(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrlTransaction}/resend-otp`, payload, {
      headers: this.getAuthHeaders(),
    });
  }
  // Confirm Transaction
  confirmTransaction(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrlTransaction}/confirm-transaction`,
      payload,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  getCustomerByAccountNumber(accountNumber: string): Observable<any> {
    return this.http.get(
      `${this.baseUrlTransaction}/account/get-customer/${accountNumber}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  getCustomerByAccountNumberExternalTransfer(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrlTransaction}/inquiry-destination-account`,
      payload,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  getTransactionById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrlTransaction}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Deposit
  deposit(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrlTransaction}/deposit`, payload, {
      headers: this.getAuthHeaders(),
    });
  }
  // Withdraw
  withdraw(payload: any): Observable<any> {
    console.log(payload);
    return this.http.post(`${this.baseUrlTransaction}/withdraw`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  // Get Provider
  getProvider(): Observable<any> {
    return this.http.get(`${this.baseUrlTransaction}/paybill/providers`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Check bill
  checkBill(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrlTransaction}/payments/bills/check`,
      payload,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Pay bill
  payBill(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrlTransaction}/payments/bills/pay`,
      payload,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
  // Get Transaction History
  getTransactionHistory(params: any): Observable<any> {
    return this.http.get(
      `${this.baseUrlTransaction}/getTransactionsAndFilter`,
      {
        headers: this.getAuthHeaders(),
        params: params,
      }
    );
  }
// Get Stats
getStats(params: any): Observable<any> {
  return this.http.get(`${this.baseUrlTransaction}/admin/stats`, {
    headers: this.getAuthHeaders(),
    params: params,
  });
}
  // Get ALl Transaction

  getAllsTransaction(params: any): Observable<any> {
    return this.http.get(`${this.baseUrlTransaction}/getAllTransactions`, {
      headers: this.getAuthHeaders(),
      params: params,
    });
  }

  getFilterMetadata(): Observable<any> {
    return this.http.get(`${this.baseUrlTransaction}/getFilterMetadata`, {
      headers: this.getAuthHeaders(),
    });
  }
}

