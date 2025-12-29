import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, delay, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {ServiceResponse , InvoiceListItem} from '../../shared/models/invoice.model';

// این اینترفیس برای نمایش در "لیست" است و با DTOهای ساخت فاکتور فرق دارد
export interface Invoice {
  id: string;
  taxId?: string;
  inno: string;
  pattern: number; // 1 (General), 3 (Gold), etc.
  customerName: string;
  totalAmount: number;
  status: string; // 'InQueue', 'Pending', 'Success', 'Error'
  indatim?: number;
  createdAt: string;
  errorMessage?: string;
  referenceNumber?: string;
}

// اینترفیس آمار
export interface InvoiceStatistics {
  total: number;
  inQueue: number;
  pending: number;
  success: number;
  error: number;
  totalAmount: number;
}

export interface CreateInvoiceResponse {
  success: boolean;
  data: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/${environment.endpoints.invoices}`;

  constructor(private http: HttpClient) {}



  // --- دریافت لیست فاکتورها (Read) ---
  getInvoices(status?: string): Observable<InvoiceListItem[]> {
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    return this.http.get<ServiceResponse<InvoiceListItem[]>>(this.apiUrl, { params })
      .pipe(map(response => response.data)); // فقط دیتا را برمی‌گردانیم
  }

  // دریافت یک فاکتور با شناسه
  getInvoice(id: string): Observable<Invoice> {
    return this.http.get<ServiceResponse<Invoice>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  // ایجاد فاکتور عمومی (الگوی ۱)
  createGeneralInvoice(invoiceData: any): Observable<any> {
    return this.http.post<ServiceResponse<any>>(`${this.apiUrl}/general`, invoiceData);
  }

  // ایجاد فاکتور طلا
  createGoldInvoice(invoiceData: any): Observable<any> {
    return this.http.post<ServiceResponse<any>>(`${this.apiUrl}/gold`, invoiceData);
  }

  // حذف فاکتور
  deleteInvoice(id: string): Observable<ServiceResponse<boolean>> {
    return this.http.delete<ServiceResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  // ارسال به سامانه مودیان
  sendToTax(id: string): Observable<ServiceResponse<string>> {
    return this.http.post<ServiceResponse<string>>(`${this.apiUrl}/${id}/send`, {});
  }

  // استعلام وضعیت از سامانه
  inquireInvoice(id: string): Observable<ServiceResponse<string>> {
    return this.http.get<ServiceResponse<string>>(`${this.apiUrl}/${id}/inquire`);
  }

  uploadExcelInvoice(formData: FormData): Observable<ServiceResponse<any>> {
    return this.http.post<ServiceResponse<any>>(`${this.apiUrl}/upload-excel`, formData);
  }
  updateInvoice(id: string, invoiceData: any): Observable<CreateInvoiceResponse> {
    return this.http.put<CreateInvoiceResponse>(`${this.apiUrl}/${id}`, invoiceData);
  }
  downloadExcel(startDate: string, endDate: string): Observable<Blob> {
  // فرض بر اینه که API شما کوئری استرینگ میگیره
  const params = { startDate, endDate };
  return this.http.get(`${this.apiUrl}/export-excel`, { 
    params, 
    responseType: 'blob' // خیلی مهم: نوع پاسخ باید blob باشه
  });
}
}
