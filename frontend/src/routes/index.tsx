// === frontend/src/routes/index.tsx ===
/*
 * Home route component serving the main landing page at "/" showcasing the performance application.
 * I'm wrapping the Home page component with proper meta tags and ensuring SolidStart's file-based routing works correctly.
 */

import { Component } from 'solid-js';
import { Title, Meta } from "@solidjs/meta";
import Home from '../pages/Home';

const IndexRoute: Component = () => {
  console.log("[routes/index.tsx] Home route component executed");
  return (
    <>
      <Title>Performance Showcase | Computational Precision Meets Dark Aesthetics</Title>
      <Meta name="description" content="Explore high-performance computing, real-time fractal generation, and system metrics in a dark, contemplative interface." />
      <Meta name="keywords" content="performance, rust, solidjs, fractals, system metrics, computational showcase" />
      <Home />
    </>
  );
};

export default IndexRoute;
