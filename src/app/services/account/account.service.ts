import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Account, AccountSavings, CreditAccount, creditCards, Term, Transaction } from '../../interfaces/account.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'http://localhost:8888/account';
  private apiUrlTransaction = 'http://localhost:8888/api/transactions';
  private http = inject(HttpClient);
  token = localStorage.getItem('access-token');

  getAccounts(): Observable<Account[]>  {
      console.log(this.token);

    return this.http.get<Account[]>(`${this.apiUrl}/getAllPaymentAccount`, {
    });
  } 
  getAccountsByUserId(userId: string): Observable<Account[]>  {
    console.log("sdadasdsadasd");
    
    console.log(userId);

  return this.http.get<Account[]>(`${this.apiUrl}/getAllPaymentAccountByUserId/${userId}`, {
    headers: {
      'Authorization': `Bearer ${this.token}`
    }
  });
} 

  getTerms(): Observable<Term[]> {
    return this.http.get<Term[]>(`${this.apiUrl}/get-all-term`, {
    }); 
  }

  createSavingsAccount(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-savings-request`, formData, {
    });
  }
 

  verifyOtp(otpCode: string, savingRequestID: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm-otp-and-create-Saving-account`, {
      otpCode: otpCode,
      savingRequestID: savingRequestID
    });
  }

  resendOtp(transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-otp/${transactionId}`, {}, {
      
    });
  }

  // Payment Account
  createPaymentAccount(cifCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-payment-request/${cifCode}`, {
    });
  }

  verifyOtpPaymentAccount(otpCode: string, paymentRequestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm-otp-payment`, {
      otpCode: otpCode,
      paymentRequestId: paymentRequestId
    
    });
  }

  resendOtpPaymentAccount(transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-payment-otp/${transactionId}`, {}, {
      
    });
  }
  getAccountByAccountNumber(accountNumber: string): Observable<any> {
    return this.http.get<Account>(`${this.apiUrl}/getAccountPaymentByID/${accountNumber}`, {
      
    }); 
  }
  getTransactions(accountNumber: string, page: number = 0, size: number = 2): Observable<any> {
    console.log('page', page);
    console.log('size', size);
    return this.http.get<Transaction[]>(`${this.apiUrlTransaction}/account/${accountNumber}?page=${page}&size=${size}`, {
      
    });
  }
  getSavingsAccounts(): Observable<AccountSavings[]> {
    return this.http.get<AccountSavings[]>(`${this.apiUrl}/getAllSavingAccount`, {
      
    });
  } 
  createWithdrawTransaction(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-request-withdraw-fromSaving`, formData, {
      
    });
  } 
  verifyWithdrawOtp(otpCode: string, savingRequestID: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm-otp-withdraw-saving`, {
      otpCode: otpCode,
      savingRequestID: savingRequestID
    
    });
  }
  getCreditCards(): Observable<creditCards[]> {
    return this.http.get<creditCards[]>(`${this.apiUrl}/getAllCreditCard`, {
      
    });
  }
  applyCredit(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-credit-request`, formData, {
      
    });
  }
  verifyOtpCredit(otpCode: string, creditRequestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm-otp-credit`, {
      otpCode: otpCode,
      creditRequestId: creditRequestId
    
    });
  }
  resendOtpCredit(creditRequestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-otp-credit/${creditRequestId}`, {} , {
      
    });
  }
  getCreditAccounts(): Observable<CreditAccount[]> {
    return this.http.get<CreditAccount[]>(`${this.apiUrl}/getAllCreditAccount`);
  }
  sendOtpForCardDetails(accountNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp/credit/getSensitiveInfo/${accountNumber}`, {}, {
      
    });
  }
  verifyOtpForCardDetails(otpCode: string, transactionId: string, accountNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm-otp/credit/getSensitiveInfo`, { 
      otpCode: otpCode,
      tempRequestKey: transactionId,
      accountNumber: accountNumber
    
    });
  }
  getAllCreditCards(): Observable<creditCards[]> {  
    return this.http.get<creditCards[]>(`${this.apiUrl}/getAllCreditAccount-anyway`, {
    });
  }
  getAccountCreationStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/admin/statistic/accounts/growth`, {
    });
  }
  getAccountStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/admin/statistic/dashboard`, {
    });
  }
}
