import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensajeDeError } from '../../core/http/errores';
import { AuthLayout } from './auth-layout';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatFormField, MatLabel, MatError, MatInput, MatButton, MatProgressBar, AuthLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-layout>
      <form [formGroup]="form" (ngSubmit)="ingresar()" class="flex flex-col gap-6" novalidate>
        <div class="flex flex-col gap-2">
          <h1 class="m-0 text-[28px] font-semibold tracking-tight">Inicia sesión</h1>
          <p class="m-0 text-[15px] text-muted">Ingresa con tu cuenta para ver y gestionar tus tickets.</p>
        </div>

        @if (sesion() === 'expirada') {
          <p class="m-0 rounded-lg bg-progreso-bg px-3 py-2 text-sm text-progreso-fg" role="status">
            Tu sesión expiró. Vuelve a iniciar sesión.
          </p>
        }
        @if (error()) {
          <p class="m-0 rounded-lg bg-critica/10 px-3 py-2 text-sm text-critica" role="alert">{{ error() }}</p>
        }

        <div class="flex flex-col gap-4">
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" placeholder="tu@empresa.com" />
            @if (form.controls.email.hasError('required')) {
              <mat-error>El email es obligatorio</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.hasError('required')) {
              <mat-error>La contraseña es obligatoria</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-2">
          <button matButton="filled" type="submit" class="h-11!" [disabled]="cargando()">Ingresar</button>
          @if (cargando()) {
            <mat-progress-bar mode="indeterminate" />
          }
        </div>

        <p class="m-0 text-center text-sm text-muted">
          ¿No tienes cuenta?
          <a routerLink="/registro" class="font-semibold text-primary no-underline hover:underline">Crear cuenta</a>
        </p>
      </form>
    </app-auth-layout>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query param `?sesion=expirada` que pone AuthService.logout(). */
  readonly sesion = input<string>();

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
