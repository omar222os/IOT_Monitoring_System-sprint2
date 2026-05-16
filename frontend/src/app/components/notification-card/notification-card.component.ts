import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Check, LucideAngularModule, TriangleAlert } from 'lucide-angular';
import { Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-card.component.html',
  styleUrls: ['./notification-card.component.css'],
})
export class NotificationCardComponent {
  @Input() notification!: Notification;

  readonly TriangleAlert = TriangleAlert;
  readonly Check = Check;

  get isAlert(): boolean {
    return this.notification.type === 'warning' || this.notification.type === 'critical';
  }

  timeAgo(date: Date): string {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} h ago`;
    return `${Math.floor(hrs / 24)} d ago`;
  }
}
