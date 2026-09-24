import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models';
import { AuthService } from './auth.service';

/** Rutas privadas: sin sesión, al login. */
export const authGuard: CanActivateFn = () =>
  inject(AuthService).autenticado() || inject(Router).createUrlTree(['/login']);

/** Login y registro: con sesión, al dashboard. */
export const invitadoGuard: CanActivateFn = () =>
  !inject(AuthService).autenticado() || inject(Router).createUrlTree(['/dashboard']);

/** Restringe una ruta a ciertos roles (la API igual lo valida con @PreAuthorize). */
export const rolGuard =
  (...roles: Rol[]): CanActivateFn =>
  () =>
    inject(AuthService).tieneRol(...roles) || inject(Router).createUrlTree(['/dashboard']);
