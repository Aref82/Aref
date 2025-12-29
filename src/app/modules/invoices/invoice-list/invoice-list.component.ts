import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { InvoiceService, InvoiceStatistics } from '../../../core/services/invoice.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { InvoiceListItem } from '../../../shared/models/invoice.model';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  standalone: false,
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
})
export class InvoiceListComponent implements OnInit {
  private readonly STATE_KEY = 'invoice_list_state';
  // --- داده‌ها ---
  invoices: InvoiceListItem[] = [];
  filteredInvoices: InvoiceListItem[] = [];
  statistics: InvoiceStatistics | null = null;

  // --- وضعیت‌ها ---
  isLoading = false;
  isRefreshing = false;

  // --- مدیریت انتخاب دسته‌جمعی (Bulk Selection) - جدید ---
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();

  // --- فیلتر و جستجو ---
  showAdvancedFilters = false;
  searchQuery: string = '';
  statusFilter: string = 'all';
  patternFilter: number = 0; // 0: همه
  minAmount: number | null = null;
  maxAmount: number | null = null;
  dateRange: Date[] = []; // تاریخ صدور
  createDateRange: Date[] = []; // تاریخ ایجاد

  // --- جدول ---
  pageSizeOptions = [10, 20, 50,100,200];
  pageSize = 10;
  pageIndex = 1;
  totalItems = 0;
  //excel variables
  isExportModalVisible = false;
  exportDateRange: Date[] = [];
  isExporting = false;

  // آپشن‌های وضعیت برای سلکت فیلتر
  statusOptions = [
    { label: 'همه وضعیت‌ها', value: 'all' },
    { label: 'در صف انتظار', value: 'InQueue' },
    { label: 'در حال ارسال', value: 'Pending' },
    { label: 'ارسال موفق', value: 'Success' },
    { label: 'خطا در ارسال', value: 'Error' }
  ];

  constructor(
    private invoiceService: InvoiceService,
    private toastr: ToastrService,
    private storageService: StorageService,
    private cdr:ChangeDetectorRef
  ) {}
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    setTimeout(()=>{
      this.cdr.detectChanges();
    } , 100)
  }
  ngOnInit(): void {
    this.loadData();
    this.restoreState();
    this.loadData();
  }
  saveState(): void {
    const state = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      searchQuery: this.searchQuery,
      statusFilter: this.statusFilter,
      patternFilter: this.patternFilter,
      // اگر تاریخ‌ها رو هم میخوای ذخیره کنی اضافه کن
    };
    this.storageService.setItem(this.STATE_KEY, state);
  }
  restoreState(): void {
    const state = this.storageService.getItem<any>(this.STATE_KEY);
    if (state) {
      this.pageIndex = state.pageIndex || 1;
      this.pageSize = state.pageSize || 10;
      this.searchQuery = state.searchQuery || '';
      this.statusFilter = state.statusFilter || 'all';
      this.patternFilter = state.patternFilter || 0;
    }
  }


  // تبدیل کد الگو به متن فارسی
  getPatternLabel(pattern: number): string {
    if (pattern === 1) return 'فروش عمومی';
    if (pattern === 3) return 'طلا، جواهر و پلاتین';
    return `الگوی ${pattern}`;
  }

  // تبدیل کد موضوع به متن و رنگ
  getSubjectInfo(ins: number): { text: string; color: string } {
    switch (ins) {
      case 1: return { text: 'اصلی', color: 'blue' };
      case 2: return { text: 'اصلاحی', color: 'orange' };
      case 3: return { text: 'ابطالی', color: 'red' };
      case 4: return { text: 'برگشت از فروش', color: 'volcano' };
      default: return { text: 'نامشخص', color: 'default' };
    }
  }

  // --- ۲. توابع مدیریت انتخاب گروهی (جدید) ---

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(value: boolean): void {

    this.filteredInvoices.forEach(item => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

 refreshCheckedStatus(): void {
    this.checked = this.filteredInvoices.length > 0 && this.filteredInvoices.every(item => this.setOfCheckedId.has(item.id));
    this.indeterminate = this.filteredInvoices.some(item => this.setOfCheckedId.has(item.id)) && !this.checked;
  }
  // عملیات ارسال گروهی
  bulkSend(): void {
    const ids = Array.from(this.setOfCheckedId);
    if (ids.length === 0) return;

    if (!confirm(`آیا از ارسال ${ids.length} فاکتور انتخاب شده به سامانه مودیان اطمینان دارید؟`)) return;

    this.toastr.info('در حال ارسال درخواست به سرور...', 'لطفا صبر کنید');

    // اینجا باید متد سرویس جدیدت رو صدا بزنی. مثلا:
    /*
    this.invoiceService.bulkSendToTax(ids).subscribe({
      next: (res) => {
        this.toastr.success('فاکتورها در صف ارسال قرار گرفتند');
        this.setOfCheckedId.clear(); // خالی کردن انتخاب‌ها
        this.refreshCheckedStatus();
        this.refreshData();
      },
      error: () => this.toastr.error('خطا در عملیات گروهی')
    });
    */
  }

  // عملیات حذف گروهی
  bulkDelete(): void {
    const ids = Array.from(this.setOfCheckedId);
    if (ids.length === 0) return;

    // فقط فاکتورهای InQueue یا Error باید حذف بشن، اینجا میتونی چک کنی یا بسپاری به بک‌ند
    if (!confirm(`هشدار: ${ids.length} فاکتور حذف خواهند شد. ادامه می‌دهید؟`)) return;

    /*
    this.invoiceService.bulkDelete(ids).subscribe(...)
    */
    this.toastr.info('این قابلیت نیازمند پیاده‌سازی سرویس بک‌ند است');
  }
  showExportModal(): void {
    this.isExportModalVisible = true;
  }
  handleExportCancel(): void {
    this.isExportModalVisible = false;
  }
  handleExportSubmit(): void {
    if(!this.exportDateRange || this.exportDateRange.length < 2){
      this.toastr.warning('لطفاً بازه زمانی را انتخاب کنید');
      return;
    }
    this.isExporting = true;
    const d1 = new Date(this.exportDateRange[0])
    const d2 = new Date(this.exportDateRange[1])

    const startDate = d1.toISOString().split('T')[0];
    const endDate = d2.toISOString().split('T')[0];

    this.invoiceService.downloadExcel(startDate, endDate)
      .pipe(finalize(()=> this.isExporting = false))
      .subscribe({
      next: (blob: Blob) => {
        // ساخت لینک دانلود موقت
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoices_${startDate}_to_${endDate}.xlsx`; // اسم فایل
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.toastr.success('فایل اکسل دانلود شد');
        this.isExportModalVisible = false;
        this.isExporting = false;
      },
      error: () => {
        this.toastr.error('خطا در دانلود فایل اکسل');
        this.isExporting = false;
      }
    });

  }
    private formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
    }

  // --- ۳. توابع اصلی (بارگذاری، فیلتر، آمار) - حفظ شده از کد خودت ---

  get activeFiltersCount(): number {
    let count = 0;
    if (this.statusFilter !== 'all') count++;
    if (this.patternFilter !== 0) count++;
    if (this.minAmount !== null || this.maxAmount !== null) count++;
    if (this.dateRange && this.dateRange.length > 0) count++;
    if (this.createDateRange && this.createDateRange.length > 0) count++;
    return count;
  }

  loadData(): void {
    this.isLoading = true;
    this.invoiceService.getInvoices('all')
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.invoices = data;
          this.applyFilters();
          this.calculateStatistics(data);
        },
        error: (error) => {
          console.error('Error loading invoices:', error);
          this.toastr.error('خطا در بارگذاری فاکتورها', 'خطا');
        }
      });
  }

  calculateStatistics(invoices: InvoiceListItem[]): void {
    this.statistics = {
      total: invoices.length,
      inQueue: invoices.filter(i => i.status === 'InQueue').length,
      pending: invoices.filter(i => i.status === 'Pending').length,
      success: invoices.filter(i => i.status === 'Success').length,
      error: invoices.filter(i => i.status === 'Error').length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0)
    };
  }

  applyFilters(): void {
    let filtered = [...this.invoices];

    // 1. جستجوی متنی
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(invoice =>
        (invoice.inno && invoice.inno.toLowerCase().includes(query)) ||
        (invoice.customerName && invoice.customerName.toLowerCase().includes(query)) ||
        (invoice.taxId && invoice.taxId.toLowerCase().includes(query)) ||
        (invoice.customerEconomicCode && invoice.customerEconomicCode.toLowerCase().includes(query))
      );
    }

    // 2. وضعیت
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === this.statusFilter);
    }

    // 3. الگو
    if (this.patternFilter !== 0) {
      filtered = filtered.filter(invoice => invoice.pattern === this.patternFilter);
    }

    // 4. مبلغ
    if (this.minAmount !== null) {
      filtered = filtered.filter(invoice => (invoice.totalAmount || 0) >= this.minAmount!);
    }
    if (this.maxAmount !== null) {
      filtered = filtered.filter(invoice => (invoice.totalAmount || 0) <= this.maxAmount!);
    }

    // 5. تاریخ صدور
    if (this.dateRange && this.dateRange.length === 2) {
      const startDate = new Date(this.dateRange[0]).setHours(0, 0, 0, 0);
      const endDate = new Date(this.dateRange[1]).setHours(23, 59, 59, 999);
      filtered = filtered.filter(invoice => {
        if (!invoice.indatim) return false;
        const invoiceDate = new Date(invoice.indatim).getTime();
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    }

    // 6. تاریخ ایجاد
    if (this.createDateRange && this.createDateRange.length === 2) {
      const startCreate = new Date(this.createDateRange[0]).setHours(0, 0, 0, 0);
      const endCreate = new Date(this.createDateRange[1]).setHours(23, 59, 59, 999);
      filtered = filtered.filter(invoice => {
        if (!invoice['createdAt']) return false;
        const cDate = new Date(invoice['createdAt']).getTime();
        return cDate >= startCreate && cDate <= endCreate;
      });
    }

    this.filteredInvoices = filtered;
    this.totalItems = filtered.length;
    this.pageIndex = 1;

    // بعد از فیلتر باید وضعیت چک‌باکس‌ها آپدیت شه
    this.refreshCheckedStatus();
    this.saveState();
  }

  onSearch(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.patternFilter = 0;
    this.minAmount = null;
    this.maxAmount = null;
    this.dateRange = [];
    this.createDateRange = [];
    this.storageService.removeItem(this.STATE_KEY);
    this.applyFilters();
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.invoiceService.getInvoices('all')
      .pipe(finalize(() => this.isRefreshing = false))
      .subscribe({
        next: (data) => {
          this.invoices = data;
          this.applyFilters();
          this.calculateStatistics(data);
          this.toastr.success('لیست به‌روز شد', 'موفق');
        },
        error: (err) => this.toastr.error('خطا در بروزرسانی', 'خطا')
      });
  }

  // --- توابع فرمت‌دهی و کمکی (UI Helpers) ---

  getStatusInfo(status: string): { text: string; color: string; icon: string } {
    switch (status) {
      case 'InQueue': return { text: 'در صف انتظار', color: 'blue', icon: 'clock-circle' };
      case 'Pending': return { text: 'در حال ارسال', color: 'orange', icon: 'sync' };
      case 'Success': return { text: 'ارسال موفق', color: 'green', icon: 'check-circle' };
      case 'Error': return { text: 'خطا در ارسال', color: 'red', icon: 'close-circle' };
      default: return { text: status, color: 'default', icon: 'question-circle' };
    }
  }

  formatDate(timestamp?: number | string): string {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('fa-IR');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  copyInvoiceNumber(invoiceNumber: string): void {
    if(!invoiceNumber) return;
    navigator.clipboard.writeText(invoiceNumber).then(() => {
      this.toastr.success(`شماره فاکتور ${invoiceNumber} کپی شد`, 'کپی شد');
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.toastr.error('مشکلی در کپی کردن پیش آمد');
    });
  }

  copyInvoiceId(invoiceId: string): void {
    if(!invoiceId) return;
    navigator.clipboard.writeText(invoiceId).then(() => {
      this.toastr.info('شناسه فاکتور کپی شد', 'موفق');
    });
  }

  // --- عملیات تکی (Single Actions) ---

  sendToTax(invoice: InvoiceListItem): void {
    if (!confirm(`ارسال فاکتور ${invoice.inno} به سامانه مودیان؟`)) return;

    this.invoiceService.sendToTax(invoice.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(res.message || 'ارسال شد', 'موفق');
          this.refreshData();
        } else {
          this.toastr.error(res.message || 'خطا در ارسال', 'خطا');
        }
      },
      error: () => this.toastr.error('خطای ارتباط با سرور')
    });
  }

  inquireStatus(invoice: InvoiceListItem): void {
    this.toastr.info('در حال استعلام...', 'لطفا صبر کنید');
    this.invoiceService.inquireInvoice(invoice.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(res.message || 'وضعیت به‌روز شد');
          this.refreshData();
        } else {
          this.toastr.warning(res.message || 'تغییری مشاهده نشد');
        }
      },
      error: () => this.toastr.error('خطای سیستم')
    });
  }

  deleteInvoice(invoice: InvoiceListItem): void {
    if (!confirm(`حذف فاکتور ${invoice.inno}؟ غیرقابل برگشت است.`)) return;

    this.invoiceService.deleteInvoice(invoice.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('حذف شد', 'موفق');
          this.refreshData();
        } else {
          this.toastr.error(res.message || 'خطا در حذف', 'خطا');
        }
      },
      error: () => this.toastr.error('خطای سیستم')
    });
  }
  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    // اگر صفحه‌بندی سمت سرور دارید، اینجا باید refreshData() را صدا بزنید
    // اگر سمت کلاینت است (همه دیتا لود شده)، نیازی به فراخوانی نیست مگر اینکه بخواهید دستی فیلتر کنید
    //this.refreshData();
  }

  // تغییر تعداد نمایش
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1; // همیشه برگرد به صفحه اول
    // this.refreshData(); // مشابه بالا
  }
}
