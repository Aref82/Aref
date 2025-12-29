import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // متد GET عمومی
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`);
  }

  // متد POST عمومی
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  // متد PUT عمومی
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  // متد DELETE عمومی
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }

  // متد POST برای آپلود فایل (هدر متفاوت)
  postWithFile(endpoint: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${endpoint}`, formData, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
        // حذف header مربوط به Content-Type برای اجازه Multipart Form Data
      })
    });
  }
}