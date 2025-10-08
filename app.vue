<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Set Kanit as the default font family */
@layer base {
  html {
    font-family: 'Kanit', sans-serif;
  }
}
</style>
