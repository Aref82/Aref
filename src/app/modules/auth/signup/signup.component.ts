import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  standalone:false,
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;
  passwordVisible = false;
  

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]], // تغییر به email
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.confirmationValidator]]
    });
  }
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(),100);
  }
  submitForm(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      // استخراج مقادیر فرم
      const { fullName, email, password } = this.signupForm.value;
      
      // ارسال به سرویس (دقت کنید که بک‌اند شما هم باید email دریافت کند)
      this.authService.signup({ fullName, email, password })
        .pipe(finalize(() =>{setTimeout(() => this.isLoading = false, 0)}))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.toastr.success('ثبت‌نام با موفقیت انجام شد');
              this.router.navigate(['/dashboard']);
            } else {
              this.toastr.error(res.message);
            }
          },
          error: () => this.toastr.error('خطا در برقراری ارتباط با سرور')
        });
    } else {
      Object.values(this.signupForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  // چک کردن لحظه‌ای رمز عبور با تکرارش
  updateConfirmValidator(): void {
    Promise.resolve().then(() => this.signupForm.controls['confirmPassword'].updateValueAndValidity());
  }

  // ولیدیتور اختصاصی برای تکرار رمز
  confirmationValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.signupForm.controls['password'].value) {
      return { confirm: true, error: true };
    }
    return {};
  };
}