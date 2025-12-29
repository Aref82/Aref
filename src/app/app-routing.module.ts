import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login/login.component';
import { SignupComponent } from './modules/auth/signup/signup.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ProfileComponent } from './modules/auth/profile/profile.component';
import { InvoiceListComponent } from './modules/invoices/invoice-list/invoice-list.component';
import { InvoiceCreateComponent } from './modules/invoices/invoice-create/invoice-create.component';
import { AuthGuard } from './core/gaurds/auth.guard';
import {UnderConstruction} from './modules/general/under-construction/under-construction';

const routes: Routes = [
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/signup', component: SignupComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'invoices', component: InvoiceListComponent },
      { path: 'invoices/new', component: InvoiceCreateComponent },
      { path: 'coming-soon', component: UnderConstruction },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
