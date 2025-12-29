import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  // ذخیره داده
  setItem(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  // خواندن داده
  getItem<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return null;
    }
  }

  // حذف داده
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // پاکسازی کل داده‌های مربوط به یک بخش (مثلا موقع خروج)
  clearAll(): void {
    localStorage.clear();
  }
}