import { Component, OnInit, HostListener } from '@angular/core';
import { LayoutService } from '../../../app/core/services/layout.service';
import { AuthService } from '../../../app/core/services/auth.service';
import { User } from '../../../app/shared/models/user.model';

@Component({
  standalone: false,
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  currentUser: User | null = null;
  isMobile = false;
  showMobileSidebar = false;
  isCollapsed = false;

  constructor(
    public layoutService: LayoutService,
    public authService: AuthService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('window:resize', ['$event'])
onResize(event: Event): void {
  console.log('Window resized:', event);
  this.checkScreenSize();
}
  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.showMobileSidebar = false;
    }
  }

  toggleMobileSidebar(): void {
    this.showMobileSidebar = !this.showMobileSidebar;
  }

  closeMobileSidebar(): void {
    this.showMobileSidebar = false;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
