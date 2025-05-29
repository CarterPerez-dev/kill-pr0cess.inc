/*
 * Index route component serving as the home page for the performance showcase application.
 * This file uses SolidStart's file-based routing where routes/index.tsx maps to the "/" path.
 */

import { Component } from 'solid-js';
import Home from '../pages/Home';

const IndexRoute: Component = () => {
  console.log("[routes/index.tsx] ROUTE COMPONENT EXECUTED!");
  return <Home />;
};

export default IndexRoute;
