import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, from, firstValueFrom } from 'rxjs';
import { tap, finalize, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenResponse } from '../models/TokenResponse'; 
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { ApiEndpointsService } from './api-endpoints.service';
import { KycService } from './kyc.service';
import Swal from 'sweetalert2';
import { AdminService } from './admin.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private refreshTokenPromise: Promise<TokenResponse> | null = null;
  private isKycVerifiedSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private kycService: KycService,
    private apiEndpointsService: ApiEndpointsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('Keycloak URL:', this.apiEndpointsService.getKeycloakUrl());
  }

  async initializeAuthState(): Promise<void> {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    console.log('[Auth Init] Bắt đầu khởi tạo auth state');

    try {
      const token = this.getToken();
      
      if (!token) {
        console.log('[Auth Init] Không có token');
        this.isAuthenticatedSubject.next(false);
        return;
      }

      const isExpired = this.isTokenExpired(token);
      const isExpiringSoon = this.isTokenExpiringSoon(token, 120);

      if (isExpired || isExpiringSoon) {
        console.log('[Auth Init] Token cần refresh, đang thực hiện...');
        
        const refreshResponse = await firstValueFrom(
          this.refreshToken().pipe(
            timeout(10000),
            catchError(error => {
              console.error('[Auth Init] Refresh token timeout hoặc lỗi:', error);
              throw error;
            })
          )
        );
        
        console.log('[Auth Init] Refresh thành công');
        this.isAuthenticatedSubject.next(true);
        
      } else {
        console.log('[Auth Init] Token hợp lệ, đăng nhập');
        this.isAuthenticatedSubject.next(true);
      }

      console.log('[Auth Init] Hoàn thành khởi tạo auth state');

    } catch (error) {
      console.error('[Auth Init] Lỗi khởi tạo:', error);
      this.handleSessionExpired('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  getUserInfo(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  checkAdminAccess(): boolean {
    const userInfo = this.getUserInfo();
    return (
      userInfo &&
      userInfo.realm_access &&
      userInfo.realm_access.roles &&
      (userInfo.realm_access.roles.includes('ADMIN') ||
        userInfo.realm_access.roles.includes('ROLE_ADMIN'))
    );
  }

  login(username: string, password: string): Observable<any> {
    console.log('Attempting login for user:', username);
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', environment.keycloak.clientId)
      .set('client_secret', environment.keycloak.clientSecret)
      .set('username', username)
      .set('password', password);

    return this.http.post(environment.keycloak.url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).pipe(
      tap((res: any) => {
        console.log('Login Response:', res);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.tokenKey, res.access_token);
          localStorage.setItem(this.refreshTokenKey, res.refresh_token);
        }
        this.isAuthenticatedSubject.next(true);

        // Kiểm tra vai trò admin
        const isAdmin = this.checkAdminAccess();
        const redirectUrl = isAdmin ? '/dashboard/transaction' : '/customer-dashboard';

        this.kycService.checkKycStatus().subscribe({
          next: ({ verified }) => {
            console.log('KYC Check after login:', verified);
            this.isKycVerifiedSubject.next(verified);

            this.router.navigate([redirectUrl]).then(() => {
              if (!verified && !isAdmin) { // Chỉ hiển thị thông báo KYC cho non-admin
                Swal.fire({
                  title: 'Xác minh danh tính',
                  text: 'Tài khoản của bạn chưa được xác minh KYC. Bạn có muốn xác minh ngay không?',
                  icon: 'info',
                  showCancelButton: true,
                  confirmButtonText: 'Xác minh ngay',
                  cancelButtonText: 'Để sau'
                }).then(result => {
                  if (result.isConfirmed) {
                    this.router.navigate(['/kyc']);
                  }
                });
              }
            });
          },
          error: (error) => {
            console.error('KYC Check Error after login:', error);
            this.router.navigate([redirectUrl]).then(() => {
              Swal.fire({
                title: 'Không thể kiểm tra KYC',
                text: 'Đã xảy ra lỗi khi kiểm tra trạng thái xác minh. Vui lòng kiểm tra lại sau.',
                icon: 'warning',
                confirmButtonText: 'OK'
              });
            });
          }
        });
      }),
      catchError((error) => {
        console.error('Login Error:', error);
        return throwError(() =>
          new Error('Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập hoặc mật khẩu.')
        );
      })
    );
  }

  logout(): void {
    console.log('Executing logout');
    this.storageService.clear();
    this.isAuthenticatedSubject.next(false);
    // this.notificationService.showSuccess('Hẹn gặp lại bạn!', 'Cảm ơn bạn đã đồng hành cùng chúng tôi').then(() => {
      this.router.navigate(['/login'])
    // });
  }

  handleSessionExpired(message: string): void {
    console.log('Handling session expired:', message);
    this.storageService.clear();
    this.isAuthenticatedSubject.next(false);
    
    Swal.fire({
      title: 'Phiên đăng nhập hết hạn',
      text: message,
      icon: 'warning',
      confirmButtonText: 'Đăng nhập lại',
      allowOutsideClick: false,
    }).then(() => {
      this.router.navigate(['/login'], { queryParams: { sessionExpired: true } }).then(() => {
        location.reload();
      });
    });
  }

  refreshToken(): Observable<TokenResponse> {
    if (this.refreshTokenPromise) {
      return from(this.refreshTokenPromise);
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('Không có refresh token');
      return throwError(() => new Error('Không có refresh token'));
    }

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', environment.keycloak.clientId)
      .set('client_secret', environment.keycloak.clientSecret)
      .set('refresh_token', refreshToken);

    const refreshRequest = this.http
      .post<TokenResponse>(this.apiEndpointsService.getKeycloakUrl(), body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((res: TokenResponse) => {
          console.log('Refresh token thành công');
          this.storageService.setItem(this.tokenKey, res.access_token);
          this.storageService.setItem(this.refreshTokenKey, res.refresh_token);
          this.isAuthenticatedSubject.next(true);
        }),
        catchError((error) => {
          console.error('Lỗi refresh token:', error);
          // Xóa tokens không hợp lệ
          this.storageService.clear();
          this.isAuthenticatedSubject.next(false);
          
          return throwError(() => new Error('Không thể làm mới token: ' + (error?.error?.message || 'Lỗi không xác định')));
        })
      );

    this.refreshTokenPromise = firstValueFrom(refreshRequest);

    return refreshRequest.pipe(
      finalize(() => {
        this.refreshTokenPromise = null;
      })
    );
  }

  async getValidToken(): Promise<string | null> {
    const token = this.getToken();
    if (!token) {
      console.warn('Không có token, chuyển hướng đến trang đăng nhập');
      this.router.navigate(['/login'], { queryParams: { sessionExpired: true } });
      return null;
    }

    if (this.isTokenExpired(token) || this.isTokenExpiringSoon(token)) {
      try {
        const res = await firstValueFrom(this.refreshToken());
        return res.access_token || null;
      } catch (err) {
        console.error('Lỗi khi làm mới token:', err);
        this.handleSessionExpired('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return null;
      }
    }

    return token;
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const isExpired = Date.now() >= exp;
      console.log('Token exp check:', { 
        exp: new Date(exp), 
        now: new Date(), 
        isExpired 
      });
      return isExpired;
    } catch (err) {
      console.error('Lỗi decode token:', err);
      return true;
    }
  }

  isTokenExpiringSoon(token: string, seconds: number = 120): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      const isExpiringSoon = exp - now < seconds;
      console.log('Token expiring soon check:', { 
        exp, 
        now, 
        diff: exp - now, 
        threshold: seconds, 
        isExpiringSoon 
      });
      return isExpiringSoon;
    } catch (e) {
      console.error('Error checking token expiring soon:', e);
      return true;
    }
  }

  getToken(): string | null {
    return this.storageService.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return this.storageService.getItem(this.refreshTokenKey);
  }

  saveToken(token: string): void {
    this.storageService.setItem(this.tokenKey, token);
    this.isAuthenticatedSubject.next(true);
  }

  saveRefreshToken(token: string): void {
    this.storageService.setItem(this.refreshTokenKey, token);
    this.isAuthenticatedSubject.next(true);
  }

  hasTokenSync(): boolean {
    const token = this.storageService.getItem(this.tokenKey);
    return token ? !this.isTokenExpired(token) : false;
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }
}