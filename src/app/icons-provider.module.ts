import { NgModule } from '@angular/core';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';

// آیکون‌هایی که باید اضافه شوند
import {
  MenuFoldOutline,
  MenuUnfoldOutline,
  DashboardOutline,
  BellOutline,        // آیکون زنگ برای اعلان
  CheckCircleOutline, // برای تیک موفقیت در اعلان
  InfoCircleOutline,  // برای پیام‌های اطلاع‌رسانی
  WarningOutline,     // برای هشدارهای مالیاتی
  UserOutline,        // برای پروفایل
  SettingOutline,     // برای تنظیمات
  LogoutOutline,      // برای خروج
  DownOutline,     // برای فلش کنار پروفایل
  FileTextOutline,    // کل فاکتورها
  DollarOutline,      // جمع مالی
  FileAddFill,        // ایجاد فاکتور جدید
  UploadOutline,         // آپلود فایل اکسل
  BarChartOutline,       // گزارش‌گیری
  TeamOutline,           // مدیریت مشتریان
  ArrowUpOutline,      // روند (فلش بالا)
  FileExcelOutline,
  AuditOutline,
  PlusOutline,
  ReloadOutline,
  SyncOutline,
  PauseOutline,
  PlusCircleOutline,
  ShoppingOutline,
  PieChartOutline,
  CloudUploadOutline,
  ThunderboltFill,
  ArrowRightOutline,
  ShopFill,
  SolutionOutline,
  CreditCardOutline,
  ShoppingCartOutline,
  FormOutline,
  MenuOutline,
  FilterOutline,
  ToolOutline,
  SaveOutline, ArrowLeftOutline, InboxOutline,
  PlusSquareOutline,
  PercentageOutline,
  MailOutline,
  LockOutline,
  UserAddOutline,

} from '@ant-design/icons-angular/icons';

const icons = [
  MenuFoldOutline,
  MenuUnfoldOutline,
  DashboardOutline,
  BellOutline,
  CheckCircleOutline,
  InfoCircleOutline,
  WarningOutline,
  UserOutline,
  SettingOutline,
  LogoutOutline,
  DownOutline,
  FileTextOutline,
  DollarOutline,
  FileAddFill,
  UploadOutline,
  BarChartOutline,
  TeamOutline,
  ArrowUpOutline,
  FileExcelOutline,
  AuditOutline,
  PlusOutline,
  ReloadOutline,
  SyncOutline,
  PauseOutline,
  PlusCircleOutline,
  ShoppingOutline,
  PieChartOutline,
  CloudUploadOutline,
  ThunderboltFill,
  ArrowRightOutline,
  ShopFill,
  SolutionOutline,
  CreditCardOutline,
  ShoppingCartOutline,
  FormOutline,
  MenuOutline,
  FilterOutline,
  ToolOutline,
  SaveOutline,
  ArrowLeftOutline,
  InboxOutline,
  PlusSquareOutline,
  PercentageOutline,
  MailOutline,
  LockOutline,
  UserAddOutline,
];

@NgModule({
  imports: [NzIconModule],
  exports: [NzIconModule],
  providers: [
    { provide: NZ_ICONS, useValue: icons }
  ]
})
export class IconsProviderModule { }
