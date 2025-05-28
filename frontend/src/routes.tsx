import { lazy } from 'solid-js';
import { RouteDefinition } from '@solidjs/router';
import Home from './pages/Home';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/projects',
    component: lazy(() => import('./pages/Projects')),
  },
  {
    path: '/performance',
    component: lazy(() => import('./pages/Performance')),
  },
  {
    path: '/about',
    component: lazy(() => import('./pages/About')),
  },
  {
    path: '/*',
    component: lazy(() => import('./routes/[...404]')),
  }
];