/*
 * About route component providing technical architecture information and philosophical foundations of the performance showcase application.
 * I'm importing and rendering the main About page component while maintaining the SolidStart routing structure and ensuring proper SEO and navigation integration.
 */

import { Component } from 'solid-js';
import { Title, Meta } from '@solidjs/meta';
import About from '../pages/About';

export default function AboutRoute(): Component {
  return (
    <>
      <Title>Architecture - Performance Showcase</Title>
      <Meta
        name="description"
        content="Deep dive into the technical architecture and design principles behind the performance showcase application. Explore the intersection of Rust, SolidJS, and computational precision."
      />
      <Meta name="keywords" content="rust, solidjs, architecture, performance, web development, technical design" />

      <About />
    </>
  );
}
