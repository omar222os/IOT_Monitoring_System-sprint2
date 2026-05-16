import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';
import { guestGuard } from '../guards/guest.guard';
import { LoginComponent } from '../pages/auth/login/login';
import { ProfileComponent } from '../pages/auth/profile/profile';
import { SignupComponent } from '../pages/auth/signup/signup';
import { DashboardComponent } from '../pages/dashboard/dashboard';
import { NotificationsComponent } from '../pages/notifications/notifications';
import { SettingsComponent } from '../pages/settings/settings';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent, canActivate: [guestGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] }
];