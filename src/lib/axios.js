import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000
})

// Rutas protegidas que requieren token en backend
const protectedRoutes = ['/citas', '/medicos']

// Interceptor de Request: inyectar Authorization Bearer
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    const isProtected = protectedRoutes.some((route) =>
      config.url?.startsWith(route)
    )

    if (isProtected && !token) {
      const error = new Error('No token provided')
      error.response = {
        status: 401,
        data: { error: 'No token provided' }
      }
      return Promise.reject(error)
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de Response: Manejo global de errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ Sesión expirada o no autorizada. Redirigiendo...')
    }
    return Promise.reject(error)
  }
)

export default api
