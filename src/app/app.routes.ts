import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./collection/collection').then((m) => m.Collection),
  },
]
