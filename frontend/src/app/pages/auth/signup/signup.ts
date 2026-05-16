import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { HeartbeatService } from '../../../services/heartbeat';
import { UserService } from '../../../services/user'; // ✅ FIXED IMPORT

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {

  signupForm: FormGroup;
  profilePicturePreview = '';
  pictureUploading = false;
  pictureUploadError = '';
  showPassword = false;
  showConfirmPassword = false;
  heartbeatStatus: 'idle' | 'loading' | 'ok' | 'error' = 'idle';
  heartbeatMessage = '';
  isSubmitting = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private heartbeatService: HeartbeatService,
    private cdr: ChangeDetectorRef,
    private cloudinary: CloudinaryService
  ) {

    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // ✅ password match validator
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { mismatch: true };
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pictureUploading = true;
    this.pictureUploadError = '';
    this.cdr.detectChanges();
    this.cloudinary.upload(file).subscribe({
      next: (url) => {
        this.profilePicturePreview = url;
        this.pictureUploading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.pictureUploadError = 'Upload failed. Please try again.';
        this.pictureUploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  testHeartbeat() {
    this.heartbeatStatus = 'loading';
    this.heartbeatMessage = '';
    this.cdr.detectChanges();

    this.heartbeatService.check().subscribe({
      next: (msg) => {
        this.heartbeatStatus = 'ok';
        this.heartbeatMessage = msg || 'Backend is alive';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.heartbeatStatus = 'error';
        this.heartbeatMessage = err?.name === 'TimeoutError'
          ? 'Timed out (no response)'
          : `Unreachable (${err.status || 0})`;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ submit handler
  onSubmit() {
    this.signupForm.markAllAsTouched();
    if (this.signupForm.invalid) return;

    this.isSubmitting = true;
    this.submitError = '';
    this.cdr.detectChanges();

    const payload: any = {
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      firstName: this.signupForm.value.firstName,
      lastName: this.signupForm.value.lastName
    };
    if (this.profilePicturePreview) {
      payload['profilePicture'] = this.profilePicturePreview;
    }

    this.userService.signup(payload).subscribe({
      next: (res) => {
        this.userService.setUser(res);
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const raw = (err.error?.message || '').toLowerCase().trim().replace(/\.+$/, '');
        const map: Record<string, string> = {
          'invalid email format':
            'Please enter a valid email address.',
          'password must be at least 6 characters and include uppercase, lowercase, numbers, and special characters':
            'Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a number, and a special character.',
          'first name max 30 chars':
            'First name must not exceed 30 characters.',
          'last name max 30 chars':
            'Last name must not exceed 30 characters.',
          'profile picture must be a valid url':
            'Profile picture must be a valid URL starting with http:// or https://.',
          'email already in use':
            'An account with this email already exists.',
        };
        this.submitError = map[raw]
          || (err.status === 409 ? 'An account with this email already exists.' : 'Something went wrong. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
}