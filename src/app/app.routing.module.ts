import { NgModule }     from '@angular/core';
import {Routes, RouterModule, PreloadAllModules} from '@angular/router';
import {InitialLoaderComponent} from "./initial-loader/initial-loader.component";

export const routes: Routes = [
  { path: '', component: InitialLoaderComponent  },
  {path: 'dashboard/:pageId', loadChildren: 'app/dashboard/dashboard.module#DashboardModule'}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes,{useHash: true, preloadingStrategy: PreloadAllModules})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
