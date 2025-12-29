import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment';
import { User } from '../../../app/shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}`; // پایه آدرس API
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // محض احتیاط موقع لود شدن سرویس، چک کن کاربر قبلاً لاگین بوده یا نه
    this.loadStoredUser();
  }

  // --- 1. لاگین و دریافت توکن ---
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${environment.endpoints.login}`, { email, password })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // اگر موفق بود، توکن رو پردازش و ذخیره کن
            this.handleAuthentication(response.data);
          }
        })
      );
  }

  // --- 2. ثبت نام ---
  signup(userData: { email: string; password: string; fullName: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${environment.endpoints.signup}`, userData);
  }

  // --- 3. دریافت پروفایل (برای چک کردن اعتبار توکن با بک‌اند) ---
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${environment.endpoints.profile}`);
  }


  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${environment.endpoints.profile}`, profileData)
      .pipe(
        tap(response => {
          if (response.success) {
            // 1. گرفتن اطلاعات فعلی از لوکال استوریج
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            // 2. ترکیب اطلاعات جدید با قبلی (Merge)
            const updatedUser = { ...currentUser, ...profileData };

            // 3. ذخیره مجدد در LocalStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // 4. بروزرسانی Observable برای تغییر آنی در UI
            this.currentUserSubject.next(updatedUser);
          }
        })
      );
  }

  // --- 4. خروج از سیستم ---
  logout(): void {
    // پاک کردن ردپای کاربر
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);

    // هدایت به صفحه لاگین
    this.router.navigate(['/auth/login']);
  }

  // --- 5. ذخیره و پردازش توکن ---
  private handleAuthentication(authData: any) {
    const token = authData.token || authData; // بسته به خروجی بک‌اند

    // اگر توکن خراب یا منقضی بود، بیخیال شو
    if (this.jwtHelper.isTokenExpired(token)) {
      this.logout();
      return;
    }

    // دیکود کردن توکن برای استخراج اطلاعات کاربر
    const decodedToken = this.jwtHelper.decodeToken(token);

    // ساخت آبجکت کاربر از روی توکن
    const user: User = {
      id: decodedToken.nameid || decodedToken.sub || authData.id,
      email: decodedToken.email || decodedToken.unique_name || authData.email,
      fullName: decodedToken.given_name || authData.fullName || 'کاربر',
      role: decodedToken.role || 'User',
      // سایر فیلدها در صورت نیاز
      fiscalId: decodedToken.fiscalId,
      phoneNumber: decodedToken.phoneNumber
    };

    // ذخیره در حافظه مرورگر
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // اطلاع‌رسانی به کل برنامه که کاربر لاگین شد
    this.currentUserSubject.next(user);
  }

  // --- 6. بازیابی کاربر هنگام رفرش صفحه ---
  private loadStoredUser() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && !this.jwtHelper.isTokenExpired(token) && userStr) {
      // اگر توکن هست و منقضی نشده، کاربر رو لاگین نگه دار
      this.currentUserSubject.next(JSON.parse(userStr));
    } else {
      // اگر توکن منقضی شده، پاکسازی کن
      if (token) {
        this.logout();
      }
    }
  }

  // --- ابزارهای کمکی ---

  // گرفتن توکن خام (برای Interceptor)
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // چک کردن وضعیت لاگین (برای Guard)
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  // گرفتن مقدار لحظه‌ای کاربر
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
