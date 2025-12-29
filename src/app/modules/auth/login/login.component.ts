import { Component , ChangeDetectorRef} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import {finalizeAsync} from '../../../shared/rx/finalize-async';

@Component({
  standalone:false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  passwordVisible = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // ولیدیشن ایمیل
      password: ['', [Validators.required]]
    });
  }
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(),100);
  }
  submitForm(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value; // دریافت ایمیل

      this.authService.login(email,password)
        .pipe(finalize(() =>{setTimeout(() => this.isLoading = false, 0)}))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.toastr.success('خوش آمدید');
              this.router.navigate(['/dashboard']);
            } else {
              this.toastr.error(res.message || 'ایمیل یا رمز عبور اشتباه است');
            }
          },
          error: () => this.toastr.error('خطا در برقراری ارتباط با سرور')
        });
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
