import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. دریافت توکن
    const token = this.authService.getToken();

    // 2. اگر توکن هست، به هدر اضافه کن
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // 3. ارسال درخواست و گوش دادن به خطاها
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // اگر خطای 401 (احراز هویت) یا 403 (دسترسی غیرمجاز) داد
        if (error.status === 401 || error.status === 403) {

          // جلوگیری از لوپ: اگر کاربر الان توی صفحه لاگین هست، ریدایرکت نکن
          if (!this.router.url.includes('/auth/login')) {
            this.authService.logout(); // پاک کردن توکن از لوکال استوریج
            this.router.navigate(['/auth/login']); // شوت کردن به صفحه لاگین
          }
        }

        return throwError(() => error);
      })
    );
  }
}
