import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Bell, LayoutDashboard, LogOut, LucideAngularModule, Settings, User } from 'lucide-angular';
import { AlertListenerService } from '../../services/alert-listener.service';
import { NotificationService } from '../../services/notification.service';
import { ProfileService } from '../../services/profile-service';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, AsyncPipe, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  readonly LayoutDashboard = LayoutDashboard;
  readonly Bell = Bell;
  readonly Settings = Settings;
  readonly User = User;
  readonly LogOut = LogOut;

  userName = '';
  userEmail = '';
  userPicture = '';

  constructor(
    public notifService: NotificationService,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private alertListener: AlertListenerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      error: () => {
        // silently ignore – sidebar still renders without user info
      }
    });

    this.profileService.profile$.subscribe(profile => {
      if (!profile) return;
      this.userName = `${profile.firstName} ${profile.lastName}`.trim();
      this.userEmail = profile.email;
      this.userPicture = profile.profilePicture || '';
      this.cdr.detectChanges();
    });
  }

  get userInitials(): string {
    return this.userName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase();
  }

  logout() {
    this.alertListener.stop();
    this.userService.logout().subscribe({
      next: () => {
        this.userService.clearUser();
        this.router.navigate(['/login']);
      },
      error: () => {
        // clear locally even if the server call fails
        this.userService.clearUser();
        this.router.navigate(['/login']);
      }
    });
  }
}