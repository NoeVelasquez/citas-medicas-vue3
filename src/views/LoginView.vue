<template>
  <div class="auth-page">
    <div class="auth-card" style="max-width: 480px">
      <div class="auth-logo">🏥</div>
      <h1 class="auth-title">SaludPlus</h1>
      <p class="auth-sub">Sistema de Gestión de Citas Médicas</p>

      <div v-if="error" class="alert alert-error">
        <span>⚠️</span> {{ error }}
      </div>

      <div class="form-group" style="text-align: left">
        <label class="form-label">Correo electrónico</label>
        <input
          v-model="email"
          class="input"
          type="email"
          placeholder="ejemplo@saludplus.com"
          @keyup.enter="iniciarSesion"
        />
      </div>

      <div class="form-group" style="text-align: left">
        <label class="form-label">Contraseña</label>
        <div class="password-input-wrapper">
          <input
            v-model="password"
            class="input"
            :type="mostrarPassword ? 'text' : 'password'"
            placeholder="••••••••"
            @keyup.enter="iniciarSesion"
          />
          <button
            type="button"
            class="toggle-password-btn"
            :title="mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
            @click="mostrarPassword = !mostrarPassword"
          >
            {{ mostrarPassword ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <button
        class="btn btn-primary"
        style="width: 100%; margin-top: 0.5rem"
        :disabled="cargando"
        @click="iniciarSesion"
      >
        <span v-if="cargando">Ingresando...</span>
        <span v-else>Iniciar Sesión</span>
      </button>

      <!-- Panel de Cuentas Demo para la Evaluación -->
      <div style="margin-top: 1.25rem; padding: 0.85rem; background: var(--surface-hover); border-radius: var(--radius); font-size: 0.8rem; color: var(--text-muted); text-align: left; border: 1px solid var(--border)">
        <strong style="color: var(--text-main); font-size: 0.85rem">👥 Cuentas de Prueba (RBAC):</strong>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            style="font-size: 0.75rem"
            @click="llenarCredenciales('admin@saludplus.com', '123456')"
          >
            👑 Admin (Acceso Total)
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            style="font-size: 0.75rem"
            @click="llenarCredenciales('valeria.mendoza@saludplus.com', '123456')"
          >
            🩺 Dra. Valeria (Cardiología)
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            style="font-size: 0.75rem"
            @click="llenarCredenciales('carlos.rodriguez@saludplus.com', '123456')"
          >
            🩺 Dr. Carlos (Pediatría)
          </button>
        </div>
      </div>

      <p class="auth-footer">
        ¿No tienes una cuenta?
        <RouterLink to="/register">Regístrate aquí</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const email = ref('admin@saludplus.com')
const password = ref('123456')
const mostrarPassword = ref(false)
const cargando = ref(false)
const error = ref('')

function llenarCredenciales(correoDemo, passDemo) {
  email.value = correoDemo
  password.value = passDemo
  toast.info(`Credenciales cargadas: ${correoDemo}`)
}

async function iniciarSesion() {
  if (!email.value || !password.value) {
    error.value = 'Por favor completa todos los campos.'
    return
  }

  cargando.value = true
  error.value = ''

  try {
    await auth.login(email.value, password.value)
    toast.success(`¡Bienvenido, ${auth.user?.name || 'Usuario'}!`)
    router.push('/citas')
  } catch (err) {
    console.error('Error de login:', err)
    error.value = 'Credenciales inválidas. Verifica tu correo y contraseña.'
  } finally {
    cargando.value = false
  }
}
</script>
