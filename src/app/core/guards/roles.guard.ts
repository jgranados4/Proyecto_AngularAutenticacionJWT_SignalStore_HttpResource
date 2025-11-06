import {  CanMatchFn, Router } from '@angular/router';
import { SignalStoreService } from '../services/TokenStore.service';
import { inject } from '@angular/core';
import roles from '../models/roles';

// export const rolesGuard: CanMatchFn = (route, state) => {
//    const tokenStore = inject(SignalStoreService);
//   const router = inject(Router);

//   const userRole = tokenStore.tokenInfo()?.role;
//   const allowedRoles = route.data?.['roles'] as string[];
// console.log(`🛡️ Roles Guard: Usuario="${userRole}" - Permitido="${allowedRoles}"`);
//   if (!userRole || !allowedRoles.includes(userRole)) {
//     router.navigate(['/dashboard/Home']);
//     return false;
//   }

//   return true;
// };
export const rolesGuard= (roles:roles[]):CanMatchFn=> {
  return ()=>{
     const tokenStore = inject(SignalStoreService);
     const router = inject(Router);

     const userRole = tokenStore.tokenInfo()?.role;
    
     console.log(
       `🛡️ Roles Guard: Usuario="${userRole}" - Permitido="${roles}"`
     );
     if (!userRole || !roles.includes(userRole as roles)) {
       router.navigate(['/dashboard/Home']);
       return false;
     }

     return true;
  }
};