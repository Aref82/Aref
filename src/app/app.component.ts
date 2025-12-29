import {Component, OnInit} from '@angular/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';
import {AuthService} from './core/services/auth.service';


const antDesignIcons = AllIcons as {
  [key: string]: IconDefinition;
};
const icons: IconDefinition[] = Object.keys(antDesignIcons).map(key => antDesignIcons[key]);
providers: [
  { provide: NZ_ICONS, useValue: icons }
]
@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',  // باید .component.html باشه
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // اگر کاربر لاگین است، یک بار پروفایل را بگیر تا اعتبار توکن چک شود
    if (this.authService.isAuthenticated()) {
      this.authService.getProfile().subscribe({
        next: () => {
          // توکن معتبر است و پروفایل آپدیت شد
          console.log('Token is valid');
        },
        error: (err) => {
          // اگر خطا 401 باشد، خود Interceptor کاربر را بیرون می‌اندازد
          // اینجا نیاز به کار خاصی نیست
          console.error('Token validation failed', err);
        }
      });
    }
  }
}
