import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AlertListenerService } from './services/alert-listener.service';
import { UserService } from './services/user';

const GUEST_ROUTES = ['/login', '/signup'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  constructor(
    private alertListener: AlertListenerService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        const nav = e as NavigationEnd;
        const isGuest = GUEST_ROUTES.some(r => nav.urlAfterRedirects.startsWith(r));
        if (!isGuest && this.userService.isLoggedIn()) {
          this.alertListener.start();
        } else {
          this.alertListener.stop();
        }
      });
  }
}