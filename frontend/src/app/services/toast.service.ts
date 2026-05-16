import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'warning' | 'critical' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts$ = new Subject<Toast>();

  show(type: ToastType, title: string, message: string) {
    this.toasts$.next({ id: ++this.counter, type, title, message });
  }
}
