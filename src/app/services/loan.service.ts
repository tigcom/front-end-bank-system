import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan} from '../models/loan.model';
import { ApiResponseWrapper} from '../models/api-response-wrapper.model';
import { LoanRejectionReason } from '../models/LoanRejectionReason.model';
import { CustomerResponse } from '../interfaces/customerResponse';
import { Account } from '../interfaces/account.interface';
@Injectable({
  providedIn: 'root'
})
export class LoanService {
  // URL gốc của backend Java
  private readonly baseUrl = 'http://localhost:8888/api/loans';
  private readonly fileUrl = 'http://localhost:8888/api/files';

  constructor(
    private http: HttpClient
  ) {}
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  // 1. POST: Tạo khoản vay mới
  createLoan(loan: Loan): Observable<ApiResponseWrapper<Loan>> {
    return this.http.post<ApiResponseWrapper<Loan>>(this.baseUrl, loan,{ headers: this.getAuthHeaders() });
  }

  // 2. PUT: Cập nhật khoản vay
  updateLoan(loan: Loan): Observable<ApiResponseWrapper<Loan>> {
    return this.http.put<ApiResponseWrapper<Loan>>(this.baseUrl, loan,{ headers: this.getAuthHeaders() });
  }

  // 3. POST: Phê duyệt khoản vay
  approveLoan(loanId: number): Observable<ApiResponseWrapper<Loan>> {
    return this.http.post<ApiResponseWrapper<Loan>>(`${this.baseUrl}/${loanId}/approve`, {}, { headers: this.getAuthHeaders() });
  }

  // 4. POST: Đóng khoản vay
  closeLoan(loanId: number): Observable<ApiResponseWrapper<Loan>> {
    return this.http.post<ApiResponseWrapper<Loan>>(`${this.baseUrl}/${loanId}/close`, {},{ headers: this.getAuthHeaders() });
  }

  // 5. POST: Từ chối khoản vay
  rejectLoan(loanId: number, rejection: LoanRejectionReason): Observable<ApiResponseWrapper<Loan>> {
    return this.http.post<ApiResponseWrapper<Loan>>(`${this.baseUrl}/${loanId}/reject`, rejection,{ headers: this.getAuthHeaders() });
  }

  // 6. GET: Lấy khoản vay theo ID
  getLoanById(loanId: number): Observable<ApiResponseWrapper<Loan>> {
    return this.http.get<ApiResponseWrapper<Loan>>(`${this.baseUrl}/${loanId}`, { headers: this.getAuthHeaders() });
  }

  // 7. GET: Lấy danh sách khoản vay theo customerId
  async getLoansByCustomerId(): Promise<Observable<ApiResponseWrapper<Loan[]>>> {
    return this.http.get<ApiResponseWrapper<Loan[]>>(`${this.baseUrl}/customer`,{ headers: this.getAuthHeaders() });
  }

  // 8. DELETE: Xóa khoản vay
  deleteLoan(loanId: number): Observable<ApiResponseWrapper<void>> {
    return this.http.delete<ApiResponseWrapper<void>>(`${this.baseUrl}/${loanId}`,{ headers: this.getAuthHeaders() });
  }

  // 9. GET: Lấy tất cả khoản vay
  getAllLoans(): Observable<ApiResponseWrapper<Loan[]>> {
    return this.http.get<ApiResponseWrapper<Loan[]>>(`${this.baseUrl}/getAllloans`,{ headers: this.getAuthHeaders() });
  }

  // 10. GET: Lấy tổng số tiền đã vay
  getTotalBorrowed(): Observable<ApiResponseWrapper<number>> {
    return this.http.get<ApiResponseWrapper<number>>(`${this.baseUrl}/total-borrowed`,{ headers: this.getAuthHeaders() });
  }

  // 11. GET: Lấy tổng số tiền chưa thanh toán
  getTotalOutstanding(): Observable<ApiResponseWrapper<number>> {
    return this.http.get<ApiResponseWrapper<number>>(`${this.baseUrl}/total-outstanding`,{ headers: this.getAuthHeaders() });
  }
  getCustomerDetail(userId: string): Observable<ApiResponseWrapper<CustomerResponse>> {
    return this.http.get<ApiResponseWrapper<CustomerResponse>>(`${this.baseUrl}/getCustomerById/${userId}`,{ headers: this.getAuthHeaders() });
  }
  getAccountsByUserId(userId: string): Observable<ApiResponseWrapper<Account[]>> {
    return this.http.get<ApiResponseWrapper<Account[]>>(`${this.baseUrl}/getAccountsByUserId/${userId}`,{ headers: this.getAuthHeaders() });
  }
  getAccountsByCurrentUser(): Observable<ApiResponseWrapper<Account[]>> {
    return this.http.get<ApiResponseWrapper<Account[]>>(`${this.baseUrl}/getAccounts`,{ headers: this.getAuthHeaders() });
  }
  // S3 helpers
  generatePresignedUrl(key: string, contentType?: string): Observable<string> {
    const params = new URLSearchParams({ key, ...(contentType ? { contentType } : {}) });
    return this.http.get(`${this.fileUrl}/generate-presigned-url?${params.toString()}`, { responseType: 'text' });
  }
  updateFilePath(loanId: number, filePath: string, declaredIncome?: number): Observable<ApiResponseWrapper<Loan>> {
    const body: any = { loanId, filePath };
    if (declaredIncome != null) body.declaredIncome = declaredIncome;
    return this.http.post<ApiResponseWrapper<Loan>>(`${this.fileUrl}/update-file-path`, body, { headers: this.getAuthHeaders() });
  }
  getDisplayFileUrl(filePath: string): string {
    const params = new URLSearchParams({ filePath });
    return `${this.fileUrl}/display-file?${params.toString()}`;
  }
  // API thống kê cho dashboard admin
  getTotalDisbursedSystem(): Observable<ApiResponseWrapper<number>> {
    return this.http.get<ApiResponseWrapper<number>>(`${this.baseUrl}/admin/total-disbursed`, { headers: this.getAuthHeaders() });
  }
  getTotalCollectedSystem(): Observable<ApiResponseWrapper<number>> {
    return this.http.get<ApiResponseWrapper<number>>(`${this.baseUrl}/admin/total-collected`, { headers: this.getAuthHeaders() });
  }
  getTotalProfitSystem(): Observable<ApiResponseWrapper<number>> {
    return this.http.get<ApiResponseWrapper<number>>(`${this.baseUrl}/admin/total-profit`, { headers: this.getAuthHeaders() });
  }
  getRepaymentStats(): Observable<ApiResponseWrapper<Map<string, number>>> {
    return this.http.get<ApiResponseWrapper<Map<string, number>>>('http://localhost:8888/api/repayments/stats', { headers: this.getAuthHeaders() });
  }
} 