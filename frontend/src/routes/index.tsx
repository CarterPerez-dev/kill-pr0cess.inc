/*
 * Home route component serving as the main entry point and landing page for the performance showcase application.
 * I'm importing and rendering the main Home page component while providing proper SEO metadata and ensuring optimal performance metrics tracking for the showcase's primary interface.
 */

import { Component } from 'solid-js';
import { Title, Meta } from '@solidjs/meta';
import Home from '../pages/Home';

export default function HomeRoute(): Component {
  return (
    <>
      <Title>Project and Performance - Computational Precision in Dark Aesthetics</Title>
      <Meta
        name="description"
        content="A dark, contemplative performance showcase exploring the intersection of mathematical precision and existential uncertainty through high-performance computation, fractal generation, and real-time metrics."
      />
      <Meta name="keywords" content="performance, rust, solidjs, fractals, web vitals, dark theme, computational showcase, react, techstack, portfolio" />
      <Meta property="og:title" content="Performance Showcase - Computational Precision" />
      <Meta property="og:description" content="Where mathematics dissolves into the void, and code becomes philosophy." />
      <Meta property="og:type" content="website" />
      <Meta name="theme-color" content="#000000" />

      <Home />
    </>
  );
}
