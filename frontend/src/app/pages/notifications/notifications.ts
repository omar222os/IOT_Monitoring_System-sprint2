import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationCardComponent } from '../../components/notification-card/notification-card.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [SidebarComponent, NotificationCardComponent, AsyncPipe, CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  constructor(public notifService: NotificationService) {}

  ngOnInit() {
    this.notifService.loadFromBackend();
  }

  ngOnDestroy() {
    this.notifService.markAllAsRead();
  }

  trackById(_: number, n: { id: number }) {
    return n.id;
  }
}
