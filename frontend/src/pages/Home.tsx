// frontend/src/pages/Home.tsx
import { Component, onMount } from 'solid-js';

const Home: Component = () => {
  onMount(() => {
    console.log("SIMPLE Home.tsx onMount CALLED - THIS IS GOOD!");
  });

  console.log("SIMPLE Home.tsx COMPONENT FUNCTION EXECUTED - THIS IS GOOD!");

  return (
    <div style="background-color: darkgoldenrod; color: black; padding: 40px; font-size: 28px; border: 2px solid red;">
      SIMPLIFIED HOME PAGE (Standard SolidStart Structure Attempt)
    </div>
  );
};

export default Home;
