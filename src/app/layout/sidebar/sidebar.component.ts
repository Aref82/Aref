import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LayoutService } from '../../core/services/layout.service';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  queryParams?: any;
  badge?: number;
  badgeColor?: string;
}

@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [];
  activeRoute: string = '';

  constructor(
    public layoutService: LayoutService,
    private authService: AuthService,
    private router: Router
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute = event.urlAfterRedirects || event.url;
      });
  }

  ngOnInit(): void {
    this.initializeMenu();
  }

  private initializeMenu(): void {
    this.menuItems = [
      { title: 'داشبورد', icon: 'dashboard', route: '/dashboard' },
      { title: 'فاکتورها', icon: 'file-text', route: '/invoices', badge: 3, badgeColor: '#ef4444' },
      { title: 'ایجاد فاکتور', icon: 'plus-circle', route: '/invoices/new' },
      { title: 'مشتریان', icon: 'team', route: '/coming-soon' , queryParams:{section:'customers'} },
      { title: 'کالاها', icon: 'shopping', route: '/coming-soon' , queryParams:{section:'products'} },
      { title: 'گزارشات', icon: 'pie-chart', route: '/coming-soon' , queryParams:{section:'reports'} },
      { title: 'تنظیمات', icon: 'setting', route: '/settings' },
      { title: 'پروفایل', icon: 'user', route: '/profile' }
    ];
  }

  isMenuItemActive(item: MenuItem): boolean {
   const currentUrlTree = this.router.parseUrl(this.router.url);
    const currentPath = '/' + (currentUrlTree.root.children['primary']?.segments.map(s => s.path).join('/') || '');
    const currentParams = currentUrlTree.queryParams;

    // ۱. بررسی کوئری پارامترها (مخصوص آیتم‌های Coming Soon)
    if (item.queryParams) {
      // اگر آیتم پارامتر دارد، باید هم مسیر و هم پارامتر دقیقاً یکی باشند
      return currentPath === item.route && 
             currentParams['section'] === item.queryParams['section'];
    }

    // ۲. بررسی تطابق دقیق (برای جلوگیری از تداخل فاکتورها و ایجاد فاکتور)
    if (currentPath === item.route) {
      return true;
    }

    // ۳. بررسی زیرمجموعه بودن (مثلاً وقتی در /invoices/123 هستیم باید منوی /invoices روشن شود)
    // اما نباید وقتی در /invoices/new هستیم، منوی /invoices روشن شود (چون خودش منوی جدا دارد)
    if (currentPath.startsWith(item.route) && item.route !== '/') {
      // لیست روت‌های دیگری که در منو هستند و ممکن است با این روت تداخل داشته باشند
      const otherMenuRoutes = this.menuItems
        .filter(m => m !== item && m.route.startsWith(item.route) && m.route !== item.route)
        .map(m => m.route);

      // اگر مسیر جاری دقیقاً یکی از زیرمنوهای دیگر است، والد را روشن نکن
      // مثلا اگر در /invoices/new هستیم، این شرط باعث می‌شود /invoices روشن نشود
      const isExactMatchForChild = otherMenuRoutes.includes(currentPath);
      if (isExactMatchForChild) {
        return false;
      }

      return true;
    }

    return false;
  }

  navigateTo(item: MenuItem): void {
    this.router.navigate([item.route]);
    if (window.innerWidth < 768) {
      this.layoutService.closeSidebar();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
