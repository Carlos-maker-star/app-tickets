import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from './core/auth/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión · App Tickets',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    title: 'Crear cuenta · App Tickets',
    loadComponent: () => import('./features/auth/registro').then((m) => m.Registro),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · App Tickets',
        data: { titulo: 'Dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'tickets',
        title: 'Tickets · App Tickets',
        data: { titulo: 'Tickets' },
        loadComponent: () => import('./features/tickets/ticket-list').then((m) => m.TicketList),
      },
      {
        path: 'tickets/:id',
        title: 'Detalle de ticket · App Tickets',
        data: { titulo: 'Detalle' },
        loadComponent: () => import('./features/tickets/ticket-detail').then((m) => m.TicketDetail),
      },
      {
        path: 'admin/usuarios',
        canActivate: [rolGuard('ADMIN')],
        title: 'Usuarios · App Tickets',
        data: { titulo: 'Usuarios' },
        loadComponent: () => import('./features/admin/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'admin/categorias',
        canActivate: [rolGuard('ADMIN')],
        title: 'Categorías · App Tickets',
        data: { titulo: 'Categorías' },
        loadComponent: () => import('./features/admin/categorias').then((m) => m.Categorias),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
