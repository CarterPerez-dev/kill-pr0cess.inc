import { lazy } from 'solid-js';
import type { RouteDefinition } from '@solidjs/router';
import Home from './pages/Home';
// Ensure Projects, Performance, About, and [...404] exist or comment them out for now
// For this test, only the Home route matters initially.

const NotFound404 = () => <div style="color:red; font-size:24px; padding: 20px;">MINIMAL ROUTES: 404 Component</div>;

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/projects',
    // component: lazy(() => import('./pages/Projects')),
    component: () => <div style="color:aqua">Lazy Projects Placeholder</div>
  },
  {
    path: '/performance',
    // component: lazy(() => import('./pages/Performance')),
    component: () => <div style="color:lime">Lazy Performance Placeholder</div>
  },
  {
    path: '/about',
    // component: lazy(() => import('./pages/About')),
    component: () => <div style="color:yellow">Lazy About Placeholder</div>
  },
  {
    path: '/*all', // Changed from /* to ensure it's a catch-all, or use `*`
    // component: lazy(() => import('./routes/[...404]')),
    component: NotFound404
  }
];
