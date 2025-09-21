/*
 * Performance route component serving the performance metrics and benchmarks page at "/performance".
 * I'm importing the main Performance page component and wrapping it for SolidStart's file-based routing system.
 */

import { Component } from 'solid-js';
import { Title, Meta } from "@solidjs/meta";
import Performance from '../pages/Performance';

const PerformanceRoute: Component = () => {
  return (
    <>
      <Title>Performance Metrics | Performance Showcase</Title>
      <Meta name="description" content="Real-time system performance metrics, benchmarks, and computational analysis" />
      <Performance />
    </>
  );
};

export default PerformanceRoute;
