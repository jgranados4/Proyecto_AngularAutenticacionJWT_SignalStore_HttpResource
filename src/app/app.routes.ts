import { Routes } from '@angular/router';
import { RegistrateComponent } from './componentes/registrate/registrate.component';
import { IniciarComponent } from './componentes/iniciar/iniciar.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'Registrar', component: RegistrateComponent },
  { path: 'login', component: IniciarComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
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
        loadComponent: () =>
          import('./componentes/tablas/tablas.component').then(
            (m) => m.TablasComponent
          ),
      },
    ],
  },
];
