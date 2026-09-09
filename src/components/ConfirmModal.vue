<template>
  <div v-if="visible" class="modal-overlay" @click.self="cancelar">
    <div class="modal" style="max-width: 440px; text-align: center">
      <div class="confirm-icon" :style="{ background: iconBg, color: iconColor }">
        {{ icon }}
      </div>
      <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem">
        {{ title }}
      </h3>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5">
        {{ message }}
      </p>

      <div style="display: flex; gap: 0.75rem; justify-content: center">
        <button class="btn btn-secondary" @click="cancelar">
          {{ cancelText }}
        </button>
        <button :class="`btn btn-${btnType}`" @click="confirmar">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '¿Estás seguro?' },
  message: { type: String, default: 'Esta acción no se puede deshacer.' },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  type: { type: String, default: 'danger' } // danger, warning, primary
})

const emit = defineEmits(['confirm', 'cancel'])

const btnType = computed(() => props.type)

const icon = computed(() => {
  switch (props.type) {
    case 'danger': return '🗑️'
    case 'warning': return '⚠️'
    default: return '❓'
  }
})

const iconBg = computed(() => {
  switch (props.type) {
    case 'danger': return 'var(--danger-light)'
    case 'warning': return 'var(--warning-light)'
    default: return 'var(--primary-light)'
  }
})

const iconColor = computed(() => {
  switch (props.type) {
    case 'danger': return 'var(--danger)'
    case 'warning': return '#b45309'
    default: return 'var(--primary)'
  }
})

function confirmar() {
  emit('confirm')
}

function cancelar() {
  emit('cancel')
}
</script>

<style scoped>
.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto 1rem;
}
</style>
