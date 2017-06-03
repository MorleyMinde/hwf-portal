import { NgModule }     from '@angular/core';
import {Routes, RouterModule, PreloadAllModules} from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard/home', pathMatch: 'full' },
  {path: 'data-entry', loadChildren: 'app/data-entry/data-entry.module#DataEntryModule'},
  {path: 'dashboard/:pageId', loadChildren: 'app/dashboard/dashboard.module#DashboardModule'},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes,{useHash: true, preloadingStrategy: PreloadAllModules})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
