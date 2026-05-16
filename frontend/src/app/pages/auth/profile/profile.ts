import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { ProfileService, UserProfile } from '../../../services/profile-service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = true;
  loadError = '';

  showPicturePanel = false;
  pictureUploading = false;
  pictureUpdating = false;
  pictureError = '';
  picturePreview = '';

  showPasswordPanel = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordChanging = false;
  passwordError = '';
  passwordSuccess = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  get initials(): string {
    const f = this.userProfile?.firstName?.charAt(0)?.toUpperCase() ?? '';
    const l = this.userProfile?.lastName?.charAt(0)?.toUpperCase() ?? '';
    return f + l;
  }

  private profileService = inject(ProfileService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private cloudinary = inject(CloudinaryService);

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/login']);
        } else {
          this.loadError = 'Failed to load profile.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  openPicturePanel(): void {
    this.showPicturePanel = true;
    this.showPasswordPanel = false;
    this.picturePreview = '';
    this.pictureError = '';
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  closePicturePanel(): void {
    this.showPicturePanel = false;
    this.picturePreview = '';
    this.pictureError = '';
  }

  openPasswordPanel(): void {
    this.showPasswordPanel = true;
    this.showPicturePanel = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = '';
    this.picturePreview = '';
    this.pictureError = '';
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pictureUploading = true;
    this.pictureError = '';
    this.cdr.detectChanges();
    this.cloudinary.upload(file).subscribe({
      next: (url) => {
        this.picturePreview = url;
        this.pictureUploading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.pictureError = 'Upload failed. Please try again.';
        this.pictureUploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closePasswordPanel(): void {
    this.showPasswordPanel = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  private friendlyError(err: any, fallback: string): string {
    let raw = '';
    try {
      const body = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
      raw = (body?.message || body?.detail || '').toLowerCase().trim().replace(/\.+$/, '');
    } catch { /* ignore parse failures */ }

    const map: Record<string, string> = {
      // change password
      'current password incorrect':
        'The current password you entered is incorrect.',
      'new password cannot be the same as the current password':
        'Your new password must be different from your current one.',
      'password must be at least 6 characters and include uppercase, lowercase, numbers, and special characters':
        'Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a number, and a special character.',
      // update picture
      'invalid url format':
        'Please enter a valid picture URL starting with http:// or https://.',
      // session
      'invalid session':
        'Your session has expired. Please log in again.',
      'session token is missing':
        'Your session has expired. Please log in again.',
    };

    if (raw && map[raw]) return map[raw];
    if (err.status === 401 || err.status === 403) return 'Your session has expired. Please log in again.';
    return fallback;
  }

  submitPasswordChange(): void {
    this.passwordChanging = true;
    this.passwordError = '';
    this.passwordSuccess = '';
    this.cdr.detectChanges();

    this.profileService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordChanging = false;
        this.passwordSuccess = 'Password updated successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passwordChanging = false;
        this.passwordError = this.friendlyError(err, 'Something went wrong. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  submitPictureUpdate(): void {
    if (!this.picturePreview) {
      this.pictureError = 'Please choose an image to upload.';
      return;
    }
    this.pictureUpdating = true;
    this.pictureError = '';
    this.cdr.detectChanges();

    this.profileService.updateProfilePicture(this.picturePreview).subscribe({
      next: () => {
        this.userProfile!.profilePicture = this.picturePreview;
        this.profileService.updateProfileCache(this.picturePreview);
        this.pictureUpdating = false;
        this.showPicturePanel = false;
        this.picturePreview = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.pictureUpdating = false;
        this.pictureError = this.friendlyError(err, 'Something went wrong. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
}