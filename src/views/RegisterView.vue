<template>
  <div class="auth-page">
    <div class="auth-card" style="max-width: 480px">
      <div class="auth-logo">🏥</div>
      <h1 class="auth-title">Registro de Especialista</h1>
      <p class="auth-sub">Crea tu cuenta profesional en el Sistema SaludPlus</p>

      <div v-if="error" class="alert alert-error">
        <span>⚠️</span> {{ error }}
      </div>

      <div class="form-group" style="text-align: left">
        <label class="form-label">Nombre Completo y Título *</label>
        <input
          v-model="name"
          class="input"
          placeholder="Ej: Dra. Noemi Rosio Vera Velasquez"
          @keyup.enter="registrarse"
        />
      </div>

      <div class="form-grid">
        <div class="form-group" style="text-align: left">
          <label class="form-label">Especialidad Médica *</label>
          <input
            v-model="especialidad"
            class="input"
            placeholder="Ej: Kinesiología, Cardiología..."
            @keyup.enter="registrarse"
          />
        </div>

        <div class="form-group" style="text-align: left">
          <label class="form-label">Teléfono / Celular (Solo números) *</label>
          <input
            v-model="telefono"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            class="input"
            placeholder="Ej: 78836023"
            @input="soloNumeros"
            @keyup.enter="registrarse"
          />
        </div>
      </div>

      <div class="form-group" style="text-align: left">
        <label class="form-label">Correo electrónico profesional *</label>
        <input
          v-model="email"
          class="input"
          type="email"
          placeholder="rosio@test.com"
          @keyup.enter="registrarse"
        />
      </div>

      <div class="form-group" style="text-align: left">
        <label class="form-label">Contraseña *</label>
        <div class="password-input-wrapper">
          <input
            v-model="password"
            class="input"
            :type="mostrarPassword ? 'text' : 'password'"
            placeholder="Mínimo 6 caracteres"
            @keyup.enter="registrarse"
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
        @click="registrarse"
      >
        <span v-if="cargando">Registrando especialista...</span>
        <span v-else>Crear Cuenta Profesional</span>
      </button>

      <p class="auth-footer">
        ¿Ya tienes cuenta?
        <RouterLink to="/login">Inicia sesión aquí</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../lib/axios'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const name = ref('')
const especialidad = ref('')
const telefono = ref('')
const email = ref('')
const password = ref('')
const mostrarPassword = ref(false)
const cargando = ref(false)
const error = ref('')

function soloNumeros() {
  telefono.value = telefono.value.replace(/\D/g, '')
}

async function registrarse() {
  if (!name.value.trim() || !especialidad.value.trim() || !telefono.value.trim() || !email.value.trim() || !password.value.trim()) {
    error.value = 'Por favor completa todos los campos requeridos.'
    return
  }

  // Validación de teléfono numérico
  if (!/^\d{6,10}$/.test(telefono.value.trim())) {
    error.value = 'El teléfono debe contener entre 6 y 10 dígitos numéricos.'
    return
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    error.value = 'El formato de correo electrónico es inválido.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  cargando.value = true
  error.value = ''

  try {
    // 1. Primero registrar el usuario para obtener token JWT de autenticación
    const authData = await auth.register(
      name.value.trim(),
      email.value.trim(),
      password.value.trim(),
      'medico',
      null
    )

    // 2. Ahora que el usuario está autenticado con JWT, crear su perfil en el directorio de médicos
    const colores = ['#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#8B5CF6', '#06B6D4', '#6366F1']
    const colorAleatorio = colores[Math.floor(Math.random() * colores.length)]

    const resNuevoMed = await api.post('/medicos', {
      nombre: name.value.trim(),
      especialidad: especialidad.value.trim(),
      email: email.value.trim(),
      telefono: telefono.value.trim(),
      color: colorAleatorio
    })

    const nuevoMedicoId = resNuevoMed.data.id

    // 3. Vincular el ID del médico al usuario activo
    if (auth.user) {
      auth.user.medicoId = nuevoMedicoId
      localStorage.setItem('user', JSON.stringify(auth.user))

      // Actualizar también en el backend de forma segura
      try {
        if (authData.user?.id) {
          await api.patch(`/users/${authData.user.id}`, { medicoId: nuevoMedicoId })
        }
      } catch (patchErr) {
        console.warn('Vínculo en backend:', patchErr)
      }
    }

    toast.success(`¡Bienvenida(o), ${name.value.trim()}! Tu perfil médico ha sido creado.`)
    router.push('/citas')
  } catch (err) {
    console.error('Error de registro:', err)
    if (err.response?.status === 400) {
      error.value = 'El correo electrónico ya se encuentra registrado. Por favor inicia sesión.'
    } else {
      error.value = 'Ocurrió un error al registrar la cuenta. Verifica los datos e intenta nuevamente.'
    }
  } finally {
    cargando.value = false
  }
}
</script>
