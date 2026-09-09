<template>
  <div class="app-layout">
    <Navbar />
    <main class="main-content">
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import ToastContainer from './components/ToastContainer.vue'
</script>
