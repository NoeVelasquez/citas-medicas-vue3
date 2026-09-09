import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const routes = [
  {
    path: '/',
    redirect: '/citas'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { esPublica: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { esPublica: true }
  },
  {
    path: '/citas',
    name: 'citas',
    component: () => import('../views/CitasView.vue'),
    meta: { requiereAuth: true }
  },
  {
    path: '/citas/:id',
    name: 'cita-detalle',
    component: () => import('../views/CitaDetailView.vue'),
    meta: { requiereAuth: true }
  },
  {
    path: '/medicos',
    name: 'medicos',
    component: () => import('../views/MedicosView.vue'),
    meta: { requiereAuth: true, soloAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/citas'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard Global
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    auth.initialize()
  }

  // Si la ruta requiere autenticación y el usuario no está logueado
  if (to.meta.requiereAuth && !auth.isAuthenticated) {
    next('/login')
    return
  }

  // Si es ruta pública (login/register) y ya está logueado
  if (to.meta.esPublica && auth.isAuthenticated) {
    next('/citas')
    return
  }

  // Si la ruta es solo para administradores y el usuario no es admin
  if (to.meta.soloAdmin && !auth.isAdmin) {
    const toast = useToastStore()
    toast.warning('Acceso restringido: Solo la Administración puede gestionar especialistas.')
    next('/citas')
    return
  }

  next()
})

export default router
