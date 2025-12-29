import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { InvoiceService, InvoiceStatistics } from '../../core/services/invoice.service';
import { finalize, timeout } from 'rxjs/operators'; // timeout اضافه شد
import { ToastrService } from 'ngx-toastr';
import { InvoiceListItem } from '../../shared/models/invoice.model';
import { StorageService } from '../../core/services/storage.service';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- داده‌های آماری ---
  rawInvoices: InvoiceListItem[] = [];
  chartRange: number = 7;
  statistics: InvoiceStatistics | null = null;
  last7DaysSales: { day: string; date: string; amount: number; percentage: number }[] = [];
  systemAlerts: { type: 'error' | 'warning'; message: string }[] = [];
  
  // داده‌های نمودار دایره‌ای (Pie Chart) - جدید
  pieChartData: { label: string; value: number; color: string; percent: number }[] = [];
  pieChartGradient: string = '';

  // --- تنظیمات ---
  isLoading = false;
  autoRefreshEnabled = false;
  refreshInterval: any;
  
  // کلید ذخیره‌سازی در لوکال استوریج
  private readonly SETTINGS_KEY = 'dashboard_settings_v1';
  private readonly CACHE_KEY = 'dashboard_cache_v1';

  constructor(
    private invoiceService: InvoiceService,
    private storageService: StorageService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(),100);
  }
  ngOnInit(): void {
    this.restoreState();
    // ۱. بازیابی تنظیمات از حافظه
    this.loadSettings();
    
    // ۲. لود اولیه داده‌ها
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }
  private restoreState(): void {
    // الف) بازیابی تنظیمات (مثل وضعیت دکمه بروزرسانی خودکار)
    const settings = this.storageService.getItem<{ autoRefresh: boolean }>(this.SETTINGS_KEY);
    if (settings) {
      this.autoRefreshEnabled = settings.autoRefresh;
      if (this.autoRefreshEnabled) this.startAutoRefresh();
    }

    // ب) بازیابی داده‌های کش شده (برای اینکه صفحه خالی نباشد)
    const cachedData = this.storageService.getItem<any>(this.CACHE_KEY);
    if (cachedData) {
      // پر کردن متغیرها با داده‌های قدیمی تا داده جدید برسد
      this.statistics = cachedData.statistics;
      this.last7DaysSales = cachedData.last7DaysSales;
      this.pieChartData = cachedData.pieChartData;
      this.pieChartGradient = cachedData.pieChartGradient;
      this.systemAlerts = cachedData.systemAlerts;
    }
  }

  private saveCache(): void {
    // ذخیره داده‌های فعلی در حافظه برای دفعه بعد
    const dataToCache = {
      statistics: this.statistics,
      last7DaysSales: this.last7DaysSales,
      pieChartData: this.pieChartData,
      pieChartGradient: this.pieChartGradient,
      systemAlerts: this.systemAlerts
    };
    this.storageService.setItem(this.CACHE_KEY, dataToCache);
  }
  // --- دریافت داده‌ها ---
  loadDashboardData(): void {
    // فقط اگر اتوماتیک نیست لودینگ نشان بده (که کاربر اذیت نشه)
    if (!this.autoRefreshEnabled) this.isLoading = true;

    this.invoiceService.getInvoices()
      .pipe(
        timeout(10000), // اگر بعد از ۱۰ ثانیه سرور جواب نداد، قطع کن (رفع مشکل گیر کردن)
        finalize(() =>{setTimeout(() => this.isLoading = false, 0)})
      )
      .subscribe({
        next: (invoices: InvoiceListItem[]) => {
          this.rawInvoices = invoices;
          this.saveCache();
          this.calculateStats(invoices);
          this.prepareChartData(invoices); // نمودار میله‌ای
          this.preparePieChartData(invoices); // نمودار دایره‌ای (جدید)
          this.getSystemAlerts(invoices);
        },
        error: (err) => {
          console.error('Dashboard Error:', err);
          if (!this.autoRefreshEnabled) {
            this.toastr.error('خطا در دریافت اطلاعات داشبورد');
          }
        }
      });
  }
  setChartRange(days: number) {
    this.chartRange = days;
    this.prepareChartData(this.rawInvoices); // بازسازی نمودار با بازه جدید
  }

  // ۱. محاسبه آمار کلی
  private calculateStats(invoices: InvoiceListItem[]): void {
    this.statistics = {
      total: invoices.length,
      inQueue: invoices.filter(i => i.status === 'InQueue').length,
      pending: invoices.filter(i => i.status === 'Pending').length,
      success: invoices.filter(i => i.status === 'Success').length,
      error: invoices.filter(i => i.status === 'Error').length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0)
    };
  }

  // ۲. آماده‌سازی نمودار دونات (وضعیت‌ها) - جدید
  private preparePieChartData(invoices: InvoiceListItem[]): void {
    const total = invoices.length || 1; 
    const days = [];
    const today = new Date();
    let maxAmount = 0;

    for (let i = this.chartRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // "صفر کردن ساعت" برای مقایسه دقیق تاریخ‌ها
      d.setHours(0, 0, 0, 0);

      const dayAmount = invoices
        .filter(inv => {
           // فقط فاکتورهای موفق
           if (!inv.indatim || inv.status !== 'Success') return false;
           
           // تبدیل تاریخ فاکتور به فرمت استاندارد بدون ساعت
           const invDate = new Date(inv.indatim);
           invDate.setHours(0, 0, 0, 0);

           // مقایسه زمان (Timestamp)
           return invDate.getTime() === d.getTime();
        })
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

        if (dayAmount > maxAmount) maxAmount = dayAmount;
          days.push ({
            day: d.toLocaleDateString('fa-IR', { weekday: 'long' }), // شنبه، یکشنبه ...
            date: d.toLocaleDateString('fa-IR'), // 1402/10/01
            amount: dayAmount,
            percentage: 0
          });
        
        this.last7DaysSales = days.map(d => ({
      ...d,
      percentage: maxAmount > 0 ? Math.round((d.amount / maxAmount) * 100) : 0
     }));
    }

    const successCount = invoices.filter(i => i.status === 'Success').length;
    const errorCount = invoices.filter(i => i.status === 'Error').length;
    const pendingCount = invoices.filter(i => i.status === 'Pending' || i.status === 'InQueue').length;

    this.pieChartData = [
      { label: 'موفق', value: successCount, color: '#10b981', percent: Math.round((successCount / total) * 100) }, // سبز
      { label: 'خطا', value: errorCount, color: '#ef4444', percent: Math.round((errorCount / total) * 100) },     // قرمز
      { label: 'در جریان', value: pendingCount, color: '#f59e0b', percent: Math.round((pendingCount / total) * 100) } // نارنجی
    ];

    // ساخت گرادینت CSS برای نمودار (Conic Gradient Logic)
    let currentDeg = 0;
    const gradientParts = this.pieChartData.map(item => {
      const deg = (item.value / total) * 360;
      const part = `${item.color} ${currentDeg}deg ${currentDeg + deg}deg`;
      currentDeg += deg;
      return part;
    });
    
    // اگر داده‌ای نبود، یک دایره خاکستری بکش
    this.pieChartGradient = gradientParts.length > 0 
      ? `conic-gradient(${gradientParts.join(', ')})` 
      : `conic-gradient(#e2e8f0 0deg 360deg)`;
  }

  // ۳. آماده‌سازی نمودار میله‌ای (۷ روز گذشته)
  private prepareChartData(invoices: InvoiceListItem[]): void {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let maxAmount = 0;

    for (let i = this.chartRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // محاسبه فروش موفق روز
      const dayAmount = invoices
        .filter(inv => {
           if(!inv.createdAt || inv.status !== 'Success') return false;
           const invDate = new Date(inv.createdAt);
           if(isNaN(invDate.getTime())) return false;
           invDate.setHours(0, 0, 0, 0)
       

           return new Date(inv.createdAt).toDateString() === d.toDateString();
        })
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      if (dayAmount > maxAmount) maxAmount = dayAmount;

      days.push({
        day: d.toLocaleDateString('fa-IR', { weekday: 'long' }),
        date: d.toLocaleDateString('fa-IR'),
        amount: dayAmount,
        percentage: 0
      });
    }

    this.last7DaysSales = days.map(d => ({
      ...d,
      percentage: maxAmount > 0 ? Math.round((d.amount / maxAmount) * 100) : 0
    }));
  }

  // ۴. هشدارهای سیستم
  private getSystemAlerts(invoices: InvoiceListItem[]): void {
    this.systemAlerts = [];
    const errorCount = invoices.filter(i => i.status === 'Error').length;
    
    if (errorCount > 0) {
      this.systemAlerts.push({
        type: 'error',
        message: `${errorCount} فاکتور با خطا مواجه شده‌اند. لطفاً بررسی کنید.`
      });
    }
    
    const queueCount = invoices.filter(i => i.status === 'InQueue').length;
    if (queueCount > 10) {
      this.systemAlerts.push({
        type: 'warning',
        message: `ترافیک ارسال: ${queueCount} فاکتور در صف انتظار هستند.`
      });
    }
  }

  // --- مدیریت تنظیمات و لوکال استوریج ---

  toggleAutoRefresh(): void {
    // ذخیره در لوکال استوریج
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify({ autoRefresh: this.autoRefreshEnabled }));

    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
      this.toastr.info('بروزرسانی خودکار فعال شد');
    } else {
      this.stopAutoRefresh();
      this.toastr.info('بروزرسانی خودکار متوقف شد');
    }
  }

  private loadSettings(): void {
    const saved = localStorage.getItem(this.SETTINGS_KEY);
    if (saved) {
      const settings = JSON.parse(saved);
      this.autoRefreshEnabled = settings.autoRefresh;
      if (this.autoRefreshEnabled) this.startAutoRefresh();
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh(); 
    this.refreshInterval = setInterval(() => this.loadDashboardData(), 30000); // ۳۰ ثانیه
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // --- دسترسی سریع ---
  quickAction(type: string): void {
    switch (type) {
      case 'new':
        this.router.navigate(['/invoices/new']);
        break;
      case 'customers':
        // هدایت به صفحه در دست ساخت با پارامتر
        this.router.navigate(['/coming-soon'], { queryParams: { section: 'customers' } });
        break;
      case 'report':
        this.router.navigate(['/coming-soon'], { queryParams: { section: 'reports' } });
        break;
      case 'excel':
        // می‌توان به صفحه آپلود یا مودال خاص هدایت کرد
        this.router.navigate(['/invoices/new'], { queryParams: { tab: 'upload' } }); 
        break;
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }
}