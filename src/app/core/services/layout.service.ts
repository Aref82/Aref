import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // وضعیت سایدبار (true = بسته, false = باز)
  private sidebarCollapsed = new BehaviorSubject<boolean>(false);
  sidebarCollapsed$: Observable<boolean> = this.sidebarCollapsed.asObservable();

  constructor() {
    // بارگذاری وضعیت از localStorage (اگر وجود دارد)
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      this.sidebarCollapsed.next(JSON.parse(savedState));
    }
  }

  // تغییر وضعیت سایدبار
  toggleSidebar(): void {
    const newState = !this.sidebarCollapsed.value;
    this.sidebarCollapsed.next(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  }

  // باز کردن سایدبار
  openSidebar(): void {
    this.sidebarCollapsed.next(false);
    localStorage.setItem('sidebarCollapsed', 'false');
  }

  // بستن سایدبار
  closeSidebar(): void {
    this.sidebarCollapsed.next(true);
    localStorage.setItem('sidebarCollapsed', 'true');
  }

  // دریافت وضعیت فعلی
  getSidebarState(): boolean {
    return this.sidebarCollapsed.value;
  }
}