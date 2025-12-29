import {ChangeDetectorRef, Component, destroyPlatform, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms'; // اطمینان از ایمپورت‌ها
import { Router } from '@angular/router';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { StorageService } from '../../../core/services/storage.service';
import moment from 'jalali-moment'



@Component({
  standalone: false,
  selector: 'app-invoice-create',
  templateUrl: './invoice-create.component.html',
  styleUrls: ['./invoice-create.component.scss']
})
export class InvoiceCreateComponent implements OnInit {
  private readonly STORAGE_KEY = 'invoice_draft_v1';
  // --- متغیرهای وضعیت (State) ---
  activeTab: 'manual' | 'upload' = 'manual'; // تب اصلی (دستی/اکسل)
  formTab: 'items' | 'other' = 'items';      // تب داخلی (اقلام/سایر) -> حتما باید مقدار اولیه داشته باشد


  selectedFile: File | null = null;
  isUploading = false;
  isSubmitting = false;
  isItemModalVisible = false;
  editingItemIndex: number | null = null;

  // --- فرم‌ها ---
  invoiceForm: FormGroup;
  itemForm: FormGroup;

  // --- آپشن‌های دراپ‌داون ---
  patterns = [
    { label: 'الگوی ۱ (فروش)', value: 1 },
    { label: 'الگوی ۳ (طلا و جواهر)', value: 3 }
  ];

  invoiceTypes = [
    { label: 'نوع ۱ (با اطلاعات خریدار)', value: 1 },
    { label: 'نوع ۲ (بدون اطلاعات خریدار)', value: 2 }
  ];

  subjects = [
    { label: 'اصلی', value: 1 },
    { label: 'اصلاحی', value: 2 },
    { label: 'ابطالی', value: 3 },
    { label: 'برگشت از فروش', value: 4 }
  ];

  paymentMethods = [
    { label: 'نقد', value: 1 },
    { label: 'نسیه', value: 2 },
    { label: 'نقد / نسیه', value: 3 }
  ];

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private router: Router,
    private toastr: ToastrService,
    private storageService: StorageService,
    private cdr : ChangeDetectorRef,
  ) {
    // ۱. ساخت فرم اصلی (Header + Arrays)
    this.invoiceForm = this.fb.group({
      // فیلدهای اصلی هدر
      indati2m: [Date.now(), Validators.required],
      inty: [1, Validators.required],
      inp: [1, Validators.required],
      ins: [1, Validators.required],
      inno: [''],
      irtaxid: [''],
      tob: [1],
      bid: [''],
      tinb: [''],
      setm: [1, Validators.required],
      cap: [{ value: 0, disabled: true }], // مبلغ نقدی (پیش‌فرض غیرفعال)

      // آرایه‌ها (Items, OtherTaxes, OtherFunds)
      items: this.fb.array([]),       // اقلام کالا
      otherTaxes: this.fb.array([]),  // سایر مالیات و عوارض
      otherFunds: this.fb.array([])   // سایر وجوه قانونی
    });

    // ۲. ساخت فرم مودال کالا (Body Items)
    this.itemForm = this.fb.group({
      sstid: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
      sstt: [''],
      am: [1, [Validators.required,Validators.min(0.00000001)]], // تعداد
      fee: [0, [Validators.required, Validators.min(0)]],    // فی
      dis: [0], // تخفیف
      vra: [10], // نرخ مالیات

      // فیلدهای محاسباتی (فقط جهت نگهداری مقدار)
      prdis: [0],
      adis: [0],
      vam: [0],
      tsstam: [0],

      // فیلدهای طلا
      consfee: [0], // اجرت
      spro: [0],    // سود
      bros: [0],    // حق العمل
      tcpbs: [0]    // جمع هزینه‌ها
    });
  }
  ngAfterViewInit():void{
    this.cdr.detectChanges();
     setTimeout(()=>{
       this.cdr.detectChanges();
     },100)
  }
  ngOnInit(): void {
    // لیسنر: اگر موضوع "اصلی" (1) نبود، شماره مرجع اجباری شود
    this.invoiceForm.get('ins')?.valueChanges.subscribe(val => {
      const refControl = this.invoiceForm.get('irtaxid');
      if (val !== 1) {
        refControl?.setValidators([Validators.required]);
      } else {
        refControl?.clearValidators();
      }
      refControl?.updateValueAndValidity();
    });

    // لیسنر: اگر روش تسویه "نقد/نسیه" (3) بود، فیلد مبلغ نقدی فعال شود
    this.invoiceForm.get('setm')?.valueChanges.subscribe(val => {
      const capControl = this.invoiceForm.get('cap');
      if (val === 3) {
        capControl?.enable();
      } else {
        capControl?.disable();
        capControl?.setValue(0);
      }
    });
    this.restoreDraft();
    this.invoiceForm.valueChanges.subscribe(val => {
      this.storageService.setItem(this.STORAGE_KEY, val);
    });
  }

  // --- Getters برای دسترسی آسان در HTML ---
  get items(): FormArray { return this.invoiceForm.get('items') as FormArray; }
  get otherTaxes(): FormArray { return this.invoiceForm.get('otherTaxes') as FormArray; }
  get otherFunds(): FormArray { return this.invoiceForm.get('otherFunds') as FormArray; }

  // --- توابع مدیریت اقلام کالا (Modal & CRUD) ---

  openItemModal(index: number | null = null) {
    this.editingItemIndex = index;
    if (index !== null) {
      // ویرایش: کپی مقادیر موجود به فرم مودال
      this.itemForm.patchValue(this.items.at(index).value);
    } else {
      // جدید: ریست فرم
      this.itemForm.reset({
        am: 1, fee: 0, dis: 0, vra: 10,
        consfee: 0, spro: 0, bros: 0, tcpbs: 0,
        prdis: 0, adis: 0, vam: 0, tsstam: 0
      });
    }
    this.isItemModalVisible = true;
  }

  handleModalCancel() {
    this.isItemModalVisible = false;
  }

  handleModalSubmit() {
    if (this.itemForm.invalid) {
      this.toastr.warning('لطفاً اطلاعات کالا را کامل کنید (شناسه ۱۳ رقمی، شرح و مبالغ)');
      return;
    }

    const raw = this.itemForm.getRawValue();
    const calculated = this.performCalculations(raw); // انجام محاسبات

    if (this.editingItemIndex !== null) {
      this.items.at(this.editingItemIndex).patchValue(calculated);
    } else {
      this.items.push(this.fb.group(calculated));
    }
    this.isItemModalVisible = false;
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  // --- توابع مدیریت سایر وجوه (Other Tabs) ---

  addOtherTax() {
    this.otherTaxes.push(this.fb.group({
      topic: ['', Validators.required],
      rate: [0],
      amount: [0, Validators.required]
    }));
  }
  removeOtherTax(index: number) { this.otherTaxes.removeAt(index); }

  addOtherFund() {
    this.otherFunds.push(this.fb.group({
      topic: ['', Validators.required],
      rate: [0],
      amount: [0, Validators.required]
    }));
  }
  removeOtherFund(index: number) { this.otherFunds.removeAt(index); }


  // --- موتور محاسبات (Calculation Logic) ---
  performCalculations(item: any): any {
    // گرفتن الگوی انتخاب شده از فرم اصلی
    const inp = Number(this.invoiceForm.get('inp')?.value);
    const isGold = inp === 3;

    // تبدیل مقادیر به عدد (جهت اطمینان)
    const am = Number(item.am) || 0;
    const fee = Number(item.fee) || 0;
    const dis = Number(item.dis) || 0;
    const vraRate = Number(item.vra) || 0;

    // ۱. مبلغ قبل از تخفیف (am * fee)
    item.prdis = am * fee;

    // ۲. محاسبات طلا یا عمومی
    if (isGold) {
      const consfee = Number(item.consfee) || 0;
      const spro = Number(item.spro) || 0;
      const bros = Number(item.bros) || 0;

      // جمع هزینه‌های طلا
      item.tcpbs = consfee + spro + bros;

      // مبلغ پس از کسر تخفیف در طلا
      // فرمول: (مبلغ کل طلا + هزینه‌ها) - تخفیف
      const totalValue = item.prdis + item.tcpbs;
      item.adis = totalValue - dis;
      if (item.adis < 0) item.adis = 0;

      // مالیات طلا (فقط روی اجرت و سود و حق‌العمل)
      item.vam = Math.round(item.tcpbs * (vraRate / 100));

    } else {
      // فرمول عمومی
      item.adis = item.prdis - dis;
      if (item.adis < 0) item.adis = 0;

      // مالیات عمومی
      item.vam = Math.round(item.adis * (vraRate / 100));
    }

    // ۳. جمع کل سطر
    item.tsstam = item.adis + item.vam;

    return item;
  }


  // --- محاسبات نهایی (Footer Totals) ---
  // این مقادیر دقیقاً همان‌هایی هستند که در فوتر نشان می‌دهیم

  get totalPrdis(): number { return this.sumControls(this.items, 'prdis'); }
  get totalDis(): number { return this.sumControls(this.items, 'dis'); }
  get totalAdis(): number { return this.sumControls(this.items, 'adis'); }
  get totalVam(): number { return this.sumControls(this.items, 'vam'); }

  get totalOdam(): number {
    const taxSum = this.sumControls(this.otherTaxes, 'amount');
    const fundSum = this.sumControls(this.otherFunds, 'amount');
    return taxSum + fundSum;
  }

  get totalBill(): number {
   return this.totalAdis + this.totalVam + this.totalOdam;

  }

  get cashPayment(): number {
    const setm = this.invoiceForm.get('setm')?.value;
    if (setm === 1) return this.totalBill; // تمام نقد
    if (setm === 2) return 0; // تمام نسیه
    return Number(this.invoiceForm.get('cap')?.value) || 0; // نقد/نسیه
  }

  get creditPayment(): number {
    const diff = this.totalBill - this.cashPayment;
    return diff > 0 ? diff : 0;
  }

  // تابع کمکی جمع زدن
  private sumControls(array: FormArray, key: string): number {
    return array.controls.reduce((sum, ctrl) => sum + (Number(ctrl.value[key]) || 0), 0);
  }

  // --- فرمت‌دهی قیمت ---
  formatPrice(val: number | any): string {
    if (val === null || val === undefined) return '0';
    return Number(val).toLocaleString('fa-IR');
  }

  restoreDraft(): void {
    const draft = this.storageService.getItem<any>(this.STORAGE_KEY);
    if (draft) {
      // چون FormArray داریم، باید اول سطرها رو بسازیم بعد پر کنیم
      if (draft.items && Array.isArray(draft.items)) {
        draft.items.forEach((item: any) => {
          // محاسبات مجدد انجام میدیم که مقادیر محاسباتی هم درست باشن
          const calculated = this.performCalculations(item);
          this.items.push(this.fb.group(calculated));
        });
      }

      // بازیابی سایر وجوه و مالیات‌ها (اگر داشتی)
      if (draft.otherTaxes) {
        draft.otherTaxes.forEach((t: any) => this.otherTaxes.push(this.fb.group(t)));
      }
      if (draft.otherFunds) {
        draft.otherFunds.forEach((f: any) => this.otherFunds.push(this.fb.group(f)));
      }

      // پر کردن کل فرم (به جز آرایه‌ها که بالا پر شدن)
      // استفاده از emitEvent: false تا دوباره تریگر ذخیره صدا زده نشه
      this.invoiceForm.patchValue(draft, { emitEvent: false });

      this.toastr.info('اطلاعات پیش‌نویس بازیابی شد', 'ادامه کار');
    }
  }
  // --- ارسال فرم (Submit) ---
  onSubmit() {
    if (this.invoiceForm.invalid) {
      this.toastr.warning('لطفاً فیلدهای ستاره‌دار را تکمیل کنید');
      return;
    }
    if (this.items.length === 0) {
      this.toastr.error('فاکتور بدون کالا قابل ثبت نیست');
      return;
    }

    this.isSubmitting = true;
    const fVal = this.invoiceForm.getRawValue();

    // 1. اصلاح فرمت تاریخ (تبدیل به Timestamp و تنظیم ساعت روی 23:59:59)
    let finalIndati2m = fVal.indati2m;
    if (typeof fVal.indati2m === 'string') {
      // اگر تاریخ به صورت شمسی/رشته‌ای آمده، تبدیلش کن
      const m = moment(fVal.indati2m, 'jYYYY/jMM/jDD');
      m.hour(23).minute(59).second(59).millisecond(0); // تنظیم روی آخر شب
      finalIndati2m = m.valueOf();
    } else if (fVal.indati2m instanceof Date) {
      // اگر آبجکت Date است
      const d = new Date(fVal.indati2m);
      d.setHours(23, 59, 59, 0);
      finalIndati2m = d.getTime();
    } else if (!finalIndati2m) {
      // اگر کلاً خالی بود (که نباید باشد)، تاریخ الان را بذار
      finalIndati2m = Date.now();
    }

    // 2. ساخت DTO دقیق با حروف بزرگ (PascalCase)
    // نکته مهم: استفاده از || "" باعث می‌شود هیچوقت null سمت سرور نرود
    const finalDto = {
      Header: {
        Indatim: Date.now(),
        Indati2m: finalIndati2m,
        Inty: Number(fVal.inty),
        Inp: Number(fVal.inp),
        Ins: Number(fVal.ins),
        Inno: fVal.inno || "",     // جلوگیری از ارسال null
        Irtaxid: fVal.irtaxid || "", // جلوگیری از ارسال null
        Tob: Number(fVal.tob),
        Bid: fVal.bid || "",
        Tinb: fVal.tinb || "",
        Setm: Number(fVal.setm),

        // مقادیر محاسباتی
        Tprdis: Number(this.totalPrdis),
        Tdis: Number(this.totalDis),
        Tadis: Number(this.totalAdis),
        Tvam: Number(this.totalVam),
        Todam: Number(this.totalOdam),
        Tbill: Number(this.totalBill),
        Cap: Number(this.cashPayment),
        Insp: Number(this.creditPayment)
      },
      Body: this.items.getRawValue().map((item: any) => ({
        Sstid: item.sstid || "",
        Sstt: item.sstt || "",
        Am: Number(item.am),
        Fee: Number(item.fee),
        Dis: Number(item.dis),
        Vra: Number(item.vra),
        Prdis: Number(item.prdis),
        Adis: Number(item.adis),
        Vam: Number(item.vam),
        Tsstam: Number(item.tsstam),

        // فیلدهای طلا (اگر خالی بودند، صفر بفرست)
        Consfee: Number(item.consfee || 0),
        Spro: Number(item.spro || 0),
        Bros: Number(item.bros || 0),
        Tcpbs: Number(item.tcpbs || 0)
      })),
      Payments: [] // لیست خالی برای جلوگیری از null بودن
    };

    console.log('Final Payload Sending to Server:', finalDto);

    // تشخیص سرویس (طلا یا عمومی)
    const isGold = Number(fVal.inp) === 3;
    const request = isGold
      ? this.invoiceService.createGoldInvoice(finalDto)
      : this.invoiceService.createGeneralInvoice(finalDto);

    request.pipe(
      finalize(() => {
        // استفاده از setTimeout برای رفع ارور ExpressionChanged (اون ۳۰۰ تا ارور)
        setTimeout(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }, 0);
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('فاکتور با موفقیت ثبت شد');
          this.storageService.removeItem(this.STORAGE_KEY);
          this.router.navigate(['/invoices']);
        } else {
          this.toastr.error(res.message || 'خطا در ثبت فاکتور');
        }
      },
      error: (err) => {
        console.error('Server Error Detail:', err);
        this.toastr.error('خطای ارتباط با سرور (Null Reference)');
      }
    });
  }

  // --- آپلود اکسل (بدون تغییر) ---
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.toastr.info(`فایل ${file.name} انتخاب شد`);
    }
  }

  onUploadExcel(): void {
    if (!this.selectedFile) {
      this.toastr.warning('لطفاً فایل را انتخاب کنید');
      return;
    }
    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.invoiceService.uploadExcelInvoice(formData)
      .pipe(finalize(() => this.isUploading = false))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('آپلود موفقیت‌آمیز بود');
            this.router.navigate(['/invoices']);
          } else {
            this.toastr.error(res.message);
          }
        },
        error: () => this.toastr.error('خطا در آپلود')
      });
  }
}
