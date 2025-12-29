// --- مدل‌های داخلی (برای فرم‌های انگولار - camelCase) ---
export interface BaseHeader {
  indatim?: number;
  indati2m?: number;
  inty: number;
  inno: string;
  ins: number;
  inp: number;
  irtaxid?: string;
  tob: number;
  bid?: string;
  tinb?: string;
  setm: number;
  cap: number;
  insp: number;
  // فیلدهای توتال در فرم نیستند اما برای تایپ‌اسکریپت شاید لازم شوند
}

export interface BaseBody {
  sstid: string;
  sstt: string;
  am: number;
  fee: number;
  prdis: number;
  dis: number;
  adis: number;
  vra: number;
  vam: number;
  tsstam: number; // این فیلد در مدل قبلی نبود ولی استفاده می‌شد
}

export interface GoldBody extends BaseBody {
  consfee?: number;
  spro?: number;
  bros?: number;
  tcpbs?: number;
}

// --- مدل‌های DTO برای ارسال به بک‌اند (PascalCase) ---

export interface InvoiceHeaderDto {
  Indatim?: number;
  Indati2m?: number;
  Inty: number;
  Inno: string;
  Ins: number;
  Inp: number;
  Irtaxid?: string;
  Tob: number;
  Bid?: string;
  Tinb?: string;
  Setm: number;
  Cap: number;
  Insp: number;

  // فیلدهای محاسباتی (که در مدل قبلی نبودند)
  Tprdis: number;
  Tdis: number;
  Tadis: number;
  Tvam: number;
  Todam: number;
  Tbill: number;
}

export interface InvoiceBodyDto {
  Sstid: string;
  Sstt: string;
  Am: number;
  Fee: number;
  Prdis: number;
  Dis: number;
  Adis: number;
  Vra: number;
  Vam: number;
  Tsstam: number;

  // فیلدهای طلا (اختیاری)
  Consfee?: number;
  Spro?: number;
  Bros?: number;
  Tcpbs?: number;
}

// DTO نهایی کل درخواست
export interface CreateInvoiceDto {
  Header: InvoiceHeaderDto;
  Body: InvoiceBodyDto[];
  Payments?: any[];
}

// ... بقیه مدل‌های لیست و ریسپانس ...
export interface InvoiceListItem {
  id: string;
  taxId?: string;
  inno: string;
  pattern: number;
  ins: number;
  customerName: string;
  customerEconomicCode?: string;
  totalAmount: number;
  status: string;
  indatim?: number;
  createdAt?: number;
  errorMessage?: string;
  referenceNumber?: string;
}

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message: string;
}
