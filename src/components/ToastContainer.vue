<template>
  <div class="toast-container">
    <transition-group name="toast-anim" tag="div">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        @click="toastStore.remove(toast.id)"
      >
        <span class="toast-icon">{{ getIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()

function getIcon(type) {
  switch (type) {
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    default:
      return 'ℹ️'
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-main);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  min-width: 280px;
  max-width: 420px;
  border-left: 5px solid;
  transition: all 0.2s ease;
}

.toast:hover {
  transform: translateY(-2px);
}

.toast-success {
  border-color: var(--success);
  background: #ffffff;
}

.toast-error {
  border-color: var(--danger);
  background: #ffffff;
}

.toast-warning {
  border-color: var(--warning);
  background: #ffffff;
}

.toast-info {
  border-color: var(--primary);
  background: #ffffff;
}

.toast-icon {
  font-size: 1.1rem;
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem;
}

/* Animaciones */
.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.3s ease;
}

.toast-anim-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.toast-anim-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
</style>
