import { Component, onMount } from "solid-js";
import { Title, Meta } from "@solidjs/meta";
import HomePageContent from "../pages/Home"; // Your actual page content from src/pages/

const IndexRoute: Component = () => {
  onMount(() => console.log("[routes/index.tsx] IndexRoute (FileRoutes) onMount."));
  console.log("[routes/index.tsx] IndexRoute (FileRoutes) rendering.");
  return (
    <>
      <Title>Home - Showcase (FileRoutes)</Title>
      <Meta name="description" content="Homepage rendered via FileRoutes." />
      <HomePageContent />
    </>
  );
};
export default IndexRoute;
