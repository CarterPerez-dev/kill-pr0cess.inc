import { Component, onMount } from 'solid-js';

const HomePageContent: Component = () => {
  onMount(() => {
    console.log("pages/Home.tsx (HomePageContent) onMount CALLED - FileRoutes Target");
  });
  console.log("pages/Home.tsx (HomePageContent) COMPONENT FUNCTION EXECUTED - FileRoutes Target");
  return (
    <div style="background-color: #00695c; color: white; padding: 40px; font-size: 28px; border: 2px solid #ffeb3b;">
      HOME PAGE CONTENT (Rendered by FileRoutes into App.tsx Router's root)
    </div>
  );
};
export default HomePageContent;
