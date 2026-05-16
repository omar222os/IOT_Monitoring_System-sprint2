import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

interface ActiveToast extends Toast {
  removing: boolean;
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css']
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ActiveToast[] = [];
  private sub!: Subscription;
  private readonly AUTO_DISMISS_MS = 6000;

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub = this.toastService.toasts$.subscribe(toast => {
      const active: ActiveToast = { ...toast, removing: false };
      this.toasts = [...this.toasts, active];
      this.cdr.detectChanges();
      setTimeout(() => this.dismiss(active.id), this.AUTO_DISMISS_MS);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  dismiss(id: number) {
    const t = this.toasts.find(t => t.id === id);
    if (!t || t.removing) return;
    t.removing = true;
    this.toasts = [...this.toasts];
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.cdr.detectChanges();
    }, 350);
  }
}
