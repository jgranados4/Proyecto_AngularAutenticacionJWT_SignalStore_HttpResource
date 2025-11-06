import { Routes } from '@angular/router';
import { RegistrateComponent } from './componentes/registrate/registrate.component';
import { IniciarComponent } from './componentes/iniciar/iniciar.component';
import { authGuard } from './core/guards/auth.guard';
import { rolesGuard } from './core/guards/roles.guard';

export const routes: Routes = [
  {
    path: 'Registrar',
    loadComponent: () =>
      import('./componentes/registrate/registrate.component').then(
        (m) => m.RegistrateComponent
      ),
    title: 'Registro',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./componentes/iniciar/iniciar.component').then(
        (m) => m.IniciarComponent
      ),
    title: 'Iniciar Sesión',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'Home',
        loadComponent: () =>
          import('./componentes/home/home.component').then(
            (m) => m.HomeComponent
          ),
      },
      {
        path: 'Tablas',
        canMatch:[rolesGuard(['Administrador'])],
        loadComponent: () =>
          import('./componentes/tablas/tablas.component').then(
            (m) => m.TablasComponent
          ),
      },
    ],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
