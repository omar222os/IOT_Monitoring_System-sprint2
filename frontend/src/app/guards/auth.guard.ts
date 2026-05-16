import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProfileService } from '../services/profile-service';
import { UserService } from '../services/user';

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  if (!userService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return profileService.getMyProfile().pipe(
    map(() => true),
    catchError(() => {
      userService.clearUser();
      return of(router.createUrlTree(['/login']));
    })
  );
};
