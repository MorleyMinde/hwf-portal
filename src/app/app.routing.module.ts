import { NgModule }     from '@angular/core';
import {Routes, RouterModule, PreloadAllModules} from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard/SbnKplppPd0', pathMatch: 'full' },
  {path: 'dashboard/:pageId', loadChildren: 'app/dashboard/dashboard.module#DashboardModule'}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes,{useHash: true, preloadingStrategy: PreloadAllModules})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
