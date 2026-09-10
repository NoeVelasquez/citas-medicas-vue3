import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../lib/axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => {
    if (!user.value) return false
    return user.value.rol === 'admin' || user.value.email === 'admin@saludplus.com'
  })
  const isRecepcion = computed(() => {
    if (!user.value) return false
    return user.value.rol === 'recepcion' || user.value.email === 'recepcion@saludplus.com'
  })
  const isAdminOrRecepcion = computed(() => isAdmin.value || isRecepcion.value)
  const isMedico = computed(() => !isAdminOrRecepcion.value)
  const currentMedicoId = computed(() => user.value?.medicoId || null)

  function initialize() {
    if (!initialized.value) {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        token.value = storedToken
        try {
          user.value = JSON.parse(storedUser)
        } catch {
          user.value = null
        }
      }
      initialized.value = true
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    token.value = data.accessToken
    user.value = data.user
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  async function register(name, email, password, rol = 'admin', medicoId = null) {
    const payload = {
      name,
      email,
      password,
      rol,
      medicoId
    }
    const { data } = await api.post('/register', payload)
    token.value = data.accessToken
    user.value = data.user
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    initialized,
    isAuthenticated,
    isAdmin,
    isRecepcion,
    isAdminOrRecepcion,
    isMedico,
    currentMedicoId,
    initialize,
    login,
    register,
    logout
  }
})
