import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'collection',
    pathMatch: 'full',
  },
  {
    path: 'collection',
    loadComponent: () => import('./collection/collection').then((m) => m.Collection),
  },
]
