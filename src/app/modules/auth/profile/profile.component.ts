import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import {finalizeAsync} from '../../../shared/rx/finalize-async';

@Component({
  standalone:false,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;

  // متغیرهای نمایش پسورد
  passwordVisible1 = false;
  passwordVisible2 = false;
  passwordVisible3 = false;

  constructor(
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phoneNumber: [''],
      economicCode: [''],
      fiscalId: [''],
      address: [''],

      // فیلدهای پسورد
      oldPassword: [''],
      password: [''],
      confirmPassword: ['']
    });
  }
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100)
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.authService.getProfile()
      .pipe(finalize(() => {setTimeout(() => this.isLoading = false, 100)}))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.profileForm.patchValue(res.data);
          }
        },
        error: () => this.toastr.error('خطا در دریافت پروفایل')
      });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    const val = this.profileForm.value;

    // اگر کاربر قصد تغییر رمز داشت، چک‌های اولیه را انجام بده
    if (val.oldPassword || val.password) {
      if (!val.oldPassword) {
        this.toastr.warning('برای تغییر رمز، وارد کردن رمز فعلی الزامی است');
        return;
      }
      if (val.password !== val.confirmPassword) {
        this.toastr.error('تکرار رمز عبور یکسان نیست');
        return;
      }
    }

    this.isSubmitting = true;
    this.authService.updateProfile(val)
      .pipe(
        finalizeAsync(()=> this.isSubmitting=false)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('تغییرات با موفقیت ذخیره شد');
            // خالی کردن فیلدهای پسورد
            this.profileForm.patchValue({
              oldPassword: '',
              password: '',
              confirmPassword: ''
            });
          } else {
            this.toastr.error(res.message);
          }
        },
        error: () => this.toastr.error('خطای سرور')
      });
  }
}
