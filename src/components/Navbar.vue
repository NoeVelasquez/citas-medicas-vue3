<template>
  <header v-if="auth.isAuthenticated" class="navbar">
    <div class="navbar-container">
      <RouterLink to="/citas" class="navbar-brand">
        <span class="brand-icon">🏥</span>
        <span class="brand-text">SaludPlus</span>
      </RouterLink>

      <nav class="navbar-nav">
        <RouterLink to="/citas" class="nav-link">
          <span>📅</span> {{ auth.isAdmin ? 'Todas las Citas' : 'Mis Citas Médicas' }}
        </RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/medicos" class="nav-link">
          <span>👨‍⚕️</span> Directorio Especialistas
        </RouterLink>
      </nav>

      <div class="navbar-user">
        <div class="user-badge" :title="auth.user?.email">
          <div class="user-avatar" :style="auth.isAdmin ? '' : 'background: #10b981'">
            {{ inicialUsuario }}
          </div>
          <div>
            <div style="font-size: 0.85rem; line-height: 1.1">
              {{ auth.user?.name || 'Usuario' }}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700">
              {{ auth.isAdmin ? '👑 Administrador' : '🩺 Especialista' }}
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="cerrarSesion" title="Cerrar sesión">
          <span>🚪</span> Salir
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToastStore()

const inicialUsuario = computed(() => {
  return auth.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'U'
})

function cerrarSesion() {
  auth.logout()
  toast.info('Has cerrado sesión correctamente.')
  router.push('/login')
}
</script>
