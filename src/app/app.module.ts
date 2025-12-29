import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {NZ_I18N, fa_IR, NZ_DATE_LOCALE} from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import localeFa from '@angular/common/locales/fa';
import fa from '@angular/common/locales/fa';
import { ToastrModule } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { CommonModule, SlicePipe } from '@angular/common';
import { IconsProviderModule } from './icons-provider.module';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';

import { faIR } from 'date-fns/locale';
// کامپوننت‌ها
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// NG-ZORRO ماژول‌ها
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzOptionComponent } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { JwtModule } from '@auth0/angular-jwt';
import {NzTooltipModule} from 'ng-zorro-antd/tooltip';
import {NzDropdownModule} from 'ng-zorro-antd/dropdown';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import {NgPersianDatepickerModule} from 'ng-persian-datepicker';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

// کامپوننت‌های ما
 import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
 import { SidebarComponent } from './layout/sidebar/sidebar.component';
 import { LoginComponent } from './modules/auth/login/login.component';
import { SignupComponent } from './modules/auth/signup/signup.component';
 import { ProfileComponent } from './modules/auth/profile/profile.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
 import { InvoiceListComponent } from './modules/invoices/invoice-list/invoice-list.component';
 import { InvoiceCreateComponent } from './modules/invoices/invoice-create/invoice-create.component';


// سرویس‌ها
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { InvoiceService } from './core/services/invoice.service';
import {NzDividerComponent} from 'ng-zorro-antd/divider';

registerLocaleData(fa);


export function tokenGetter() {
  return localStorage.getItem('token');
}
registerLocaleData(localeFa);
@NgModule({
  declarations: [
   AppComponent,
    MainLayoutComponent,
    SidebarComponent,
    LoginComponent,
    SignupComponent,
    ProfileComponent,
    DashboardComponent,
    InvoiceCreateComponent,
    InvoiceListComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule,
    CommonModule,
    IconsProviderModule,
    BrowserAnimationsModule,
    NgPersianDatepickerModule,


    // Toastr برای نوتیفیکیشن
    ToastrModule.forRoot({
      timeOut: 4000,
      positionClass: 'toast-top-left', // <--- مهم: بالا سمت چپ
      preventDuplicates: true,
      progressBar: true,
      progressAnimation: 'increasing',
      closeButton: true,
      enableHtml: true,
      easing: 'ease-in',
      easeTime: 300
    }),

    // JWT Module
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['127.0.0.1'],
        disallowedRoutes: []
      }
    }),
    NzButtonModule,
    NzInputModule,
    NzInputNumberModule,
    NzFormModule,
    NzCardModule,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzDropdownModule,
    NzAvatarModule,
    NzBadgeModule,
    NzTableModule,
    NzModalModule,
    NzUploadModule,
    NzDatePickerModule,
    NzSelectModule,
    NzTagModule,
    NzSwitchModule,
    NzAlertModule,
    NzEmptyModule,
    NzSpinModule,
    NzPopoverModule,
    NzRadioModule,
    NzTooltipModule,
    NzDividerComponent,
    NzPaginationModule,
  ],
  providers: [
    { provide: NZ_I18N, useValue: fa_IR },
    { provide: NZ_DATE_LOCALE, useValue:faIR },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    InvoiceService,
    SlicePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
