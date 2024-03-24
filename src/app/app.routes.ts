import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { TablasComponent } from './componentes/tablas/tablas.component';
import { RegistrateComponent } from './componentes/registrate/registrate.component';
import { IniciarComponent } from './componentes/iniciar/iniciar.component';

export const routes: Routes = [
  { path: 'Home', component: HomeComponent },
  { path: 'Tablas', component: TablasComponent },
  {path:'Registrar',component:RegistrateComponent},
  {path:'login',component:IniciarComponent},
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
];
