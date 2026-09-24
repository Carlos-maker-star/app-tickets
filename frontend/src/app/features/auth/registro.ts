import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensajeDeError } from '../../core/http/errores';
import { AuthLayout } from './auth-layout';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, MatFormField, MatLabel, MatError, MatHint, MatInput, MatButton, MatProgressBar, AuthLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-layout>
      <form [formGroup]="form" (ngSubmit)="registrar()" class="flex flex-col gap-6" novalidate>
        <div class="flex flex-col gap-2">
          <h1 class="m-0 text-[28px] font-semibold tracking-tight">Crea tu cuenta</h1>
          <p class="m-0 text-[15px] text-muted">Podrás reportar incidencias y seguir su avance.</p>
        </div>

        @if (error()) {
          <p class="m-0 rounded-lg bg-critica/10 px-3 py-2 text-sm text-critica" role="alert">{{ error() }}</p>
        }

        <div class="flex flex-col gap-4">
          <mat-form-field>
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="nombre" autocomplete="name" maxlength="100" />
            @if (form.controls.nombre.hasError('required')) {
              <mat-error>El nombre es obligatorio</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" maxlength="150" />
            @if (form.controls.email.hasError('required')) {
              <mat-error>El email es obligatorio</mat-error>
            } @else if (form.controls.email.hasError('email')) {
              <mat-error>El email no es válido</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" maxlength="72" />
            <mat-hint>Mínimo 8 caracteres</mat-hint>
            @if (form.controls.password.hasError('required')) {
              <mat-error>La contraseña es obligatoria</mat-error>
            } @else if (form.controls.password.hasError('minlength')) {
              <mat-error>Debe tener al menos 8 caracteres</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-2">
          <button matButton="filled" type="submit" class="h-11!" [disabled]="cargando()">Crear cuenta</button>
          @if (cargando()) {
            <mat-progress-bar mode="indeterminate" />
          }
        </div>

        <p class="m-0 text-center text-sm text-muted">
          ¿Ya tienes cuenta?
          <a routerLink="/login" class="font-semibold text-primary no-underline hover:underline">Inicia sesión</a>
        </p>
      </form>
    </app-auth-layout>
  `,
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, email, password } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.auth.registrar(nombre, email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
