import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { TablasComponent } from './componentes/tablas/tablas.component';
import { RegistrateComponent } from './componentes/registrate/registrate.component';
import { IniciarComponent } from './componentes/iniciar/iniciar.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'Home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'Tablas', component: TablasComponent, canActivate: [authGuard] },
  { path: 'Registrar', component: RegistrateComponent },
  { path: 'login', component: IniciarComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
