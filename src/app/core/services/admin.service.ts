import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { UserService } from './user.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { ApiEndpointsService } from './api-endpoints.service'; 
import { ApiResponse } from '../models/ApiResponse';
import { KycStatisticsResponse } from '../models/KycStatisticsResponse';
import { CustomerGrowthResponse } from '../models/CustomerGrowthResponse';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private isAdminSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private apiEndpointsService: ApiEndpointsService
  ) {
    this.restoreAdminState();
  }

  private restoreAdminState(): void {
    const userInfo = this.userService.getUserInfo();
    if (userInfo && userInfo.realm_access && userInfo.realm_access.roles && userInfo.realm_access.roles.includes('ADMIN')) {
      this.isAdminSubject.next(true);
    }
  }

  isAdmin(): Observable<boolean> {
    return this.isAdminSubject.asObservable();
  }

  checkAdminAccess(): boolean {
    const userInfo = this.userService.getUserInfo();
    return (
      userInfo &&
      userInfo.realm_access &&
      userInfo.realm_access.roles &&
      (userInfo.realm_access.roles.includes('ADMIN') ||
        userInfo.realm_access.roles.includes('ROLE_ADMIN'))
    );
  }

  getCustomerList(page: number, size: number, keyword: string): Observable<any> {
    if (!this.checkAdminAccess()) {
      console.log(this.userService.getUserInfo())
      return throwError(() => new Error('Bạn không có quyền xem danh sách khách hàng'));
    }

    return this.http.get(this.apiEndpointsService.getCustomerListEndpoint(page, size, keyword)).pipe(
      tap((res) => console.log('Customer List:', res)),
      catchError((error) =>
        throwError(() => new Error('Lấy danh sách khách hàng thất bại: ' + (error.error?.message || 'Lỗi không xác định')))
      )
    );
  }

  getCustomerDetailByCifcode(cifCode: string): Observable<any> {
    return this.http.get(this.apiEndpointsService.getCustomerDetailByCifCodeEndpoint(cifCode)).pipe(
      tap((res) => console.log('Customer Detail Response:', res)),
      catchError((error) =>
        throwError(() => new Error(error.error?.message || 'Lấy thông tin khách hàng thất bại'))
      )
    );
  }

  updateCustomerStatus(cifCode: string, newStatus: string): Observable<any> {
    if (!this.checkAdminAccess()) {
      return throwError(() => new Error('Bạn không có quyền cập nhật trạng thái khách hàng'));
    }

    const payload = { cifCode, status: newStatus };
    return this.http.put(this.apiEndpointsService.getCustomerStatusEndpoint(), payload).pipe(
      tap((res) => console.log('Phản hồi cập nhật trạng thái khách hàng:', res)),
      catchError((error) =>
        throwError(() => new Error('Cập nhật trạng thái khách hàng thất bại: ' + (error.error?.message || 'Lỗi không xác định')))
      )
    );
  }

  getKycStatistics(startDate?: string, endDate?: string): Observable<ApiResponse<KycStatisticsResponse>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<KycStatisticsResponse>>(this.apiEndpointsService.getKycStatistics(), { params })
  }

  getCustomerGrowth(startDate?: string, endDate?: string): Observable<ApiResponse<CustomerGrowthResponse>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<CustomerGrowthResponse>>(this.apiEndpointsService.getGrowth(), { params });
  }

  getPendingKycRequests(page: number, size: number, keyword: string): Observable<any> {
    return this.http.get(`http://localhost:8888/api/customers/kyc/pending?page=${page}&size=${size}&keyword=${keyword}`);
  }

  approveKyc(cifCode: string, status: string, reason: string | null): Observable<any> {
    return this.http.post(`http://localhost:8888/api/customers/kyc/approve`, { cifCode, status, reason });
  }

  // Credit Request methods
  getAllCreditRequests(page: number, size: number, keyword: string, forceRefresh?: boolean): Observable<any> {
    const timestamp = forceRefresh ? `&_t=${Date.now()}` : '';
    return this.http.get(`http://localhost:8888/account/admin/get-all-credit-crequest?page=${page}&size=${size}&keyword=${keyword}${timestamp}`);
  }

  approveCreditRequest(creditRequestId: string): Observable<any> {
    return this.http.post(`http://localhost:8888/account/admin/approve-credit-request/${creditRequestId}`, {});
  }

  rejectCreditRequest(creditRequestId: string): Observable<any> {
    return this.http.post(`http://localhost:8888/account/admin/reject-credit-request/${creditRequestId}`, {});
  }
}