import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiEndpointsService } from './api-endpoints.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private apiEndpointsService: ApiEndpointsService
  ) {}

  getUserInfo(): any {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  getUsername(): string | null {
    const token = this.authService.getToken();
    // console.log("token: " + token)
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("payload: " + payload)
      return payload?.preferred_username || null;
    } catch {
      return null;
    }
  }

  getCustomerDetail(): Observable<any> {
    return this.http.get(this.apiEndpointsService.getCustomerDetailEndpoint()).pipe(
      tap((res) => console.log('Customer Detail:', res)),
      catchError((error) =>
        throwError(() => new Error('Lấy thông tin khách hàng thất bại: ' + (error.error?.message || 'Lỗi không xác định')))
      )
    );
  }

  updateCustomer(customerData: any): Observable<any> {
    return this.http.put(this.apiEndpointsService.getCustomerUpdateEndpoint(), customerData).pipe(
      tap((res) => console.log('Update Customer Response:', res)),
      catchError((error) =>
        throwError(() => new Error('Cập nhật thông tin khách hàng thất bại: ' + (error.error?.message || 'Lỗi không xác định')))
      )
    );
  }

  getCustomerAccounts(): Observable<any> {
    return this.http.get(this.apiEndpointsService.getCustomerAccountsEndpoint()).pipe(
      tap((res) => console.log('Customer Accounts:', res)),
      catchError((error) =>
        throwError(() => new Error('Lấy danh sách tài khoản thất bại: ' + (error.error?.message || 'Lỗi không xác định')))
      )
    );
  }

}