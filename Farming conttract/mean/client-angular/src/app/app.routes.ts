import { Routes } from '@angular/router';

import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { ResetPasswordPage } from './pages/reset-password/reset-password.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { HomePage } from './pages/home/home.page';
import { SearchPage } from './pages/search/search.page';
import { MyContractsPage } from './pages/my-contracts/my-contracts.page';
import { MarketplacePage } from './pages/marketplace/marketplace.page';
import { SupportPage } from './pages/support/support.page';
import { FarmerProfilePage } from './pages/farmer-profile/farmer-profile.page';
import { ReportsPage } from './pages/reports/reports.page';
import { AuthShellComponent } from './layout/auth-shell.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },
  {
    path: '',
    component: AuthShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomePage },
      { path: 'search', component: SearchPage },
      { path: 'farmer-profile', component: FarmerProfilePage },
      { path: 'my-contracts', component: MyContractsPage },
      { path: 'marketplace', component: MarketplacePage },
      { path: 'support', component: SupportPage },
      { path: 'reports', component: ReportsPage },
      { path: 'dashboard', component: DashboardPage },
    ],
  },
  { path: '**', redirectTo: 'login' }
];
