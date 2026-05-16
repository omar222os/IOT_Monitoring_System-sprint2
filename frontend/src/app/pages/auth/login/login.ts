import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  loginForm: FormGroup;
  isSubmitting = false;
  loginError = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    this.loginError = '';
    this.cdr.detectChanges();

    const { email, password } = this.loginForm.value;

    this.userService.login(email, password).subscribe({
      next: (res) => {
        this.userService.setUser(res);
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const raw = (err.error?.message || '').toLowerCase().trim().replace(/\.+$/, '');
        const map: Record<string, string> = {
          'invalid email format':
            'Please enter a valid email address.',
          'invalid credentials':
            'Incorrect email or password. Please try again.',
        };
        this.loginError = map[raw]
          || (err.status === 401 || err.status === 403
            ? 'Incorrect email or password. Please try again.'
            : 'Something went wrong. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  goSignup() {
    this.router.navigate(['/signup']);
  }
}