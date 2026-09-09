<template>
  <div>
    <!-- Encabezado -->
    <div class="page-header">
      <div>
        <h1 class="page-title"><span>👨‍⚕️</span> Directorio de Especialistas</h1>
        <p class="page-subtitle">Administra los médicos, especialidades y contactos de la clínica</p>
      </div>
      <button class="btn btn-primary" @click="abrirModal()">
        <span>➕</span> Nuevo Especialista
      </button>
    </div>

    <!-- Buscador y Switcher de Vista -->
    <div class="filters-bar">
      <input
        v-model="busqueda"
        class="input input-search"
        placeholder="🔍 Buscar por nombre de médico, especialidad o correo..."
      />

      <!-- Selector de Vista -->
      <div class="view-switcher">
        <button
          class="view-btn"
          :class="{ active: tipoVista === 'tabla' }"
          @click="tipoVista = 'tabla'"
          title="Vista de Tabla"
        >
          📋 Tabla
        </button>
        <button
          class="view-btn"
          :class="{ active: tipoVista === 'tarjetas' }"
          @click="tipoVista = 'tarjetas'"
          title="Vista de Tarjetas"
        >
          🗂️ Tarjetas
        </button>
      </div>

      <button v-if="busqueda" class="btn btn-ghost btn-sm" @click="busqueda = ''">
        ✕ Limpiar
      </button>
    </div>

    <!-- Estado de Carga y Vacío -->
    <div v-if="cargando" class="card empty-state">
      <p>Cargando lista de médicos especialistas...</p>
    </div>

    <div v-else-if="medicosFiltrados.length === 0" class="card empty-state">
      <div class="empty-icon">👨‍⚕️</div>
      <h3>No se encontraron especialistas</h3>
      <p>Intenta con otro término de búsqueda o agrega un nuevo médico.</p>
    </div>

    <!-- 1. VISTA TABLA -->
    <div v-else-if="tipoVista === 'tabla'" class="table-container">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Médico / Especialista</th>
              <th>Especialidad</th>
              <th>Contacto</th>
              <th>Citas Asignadas</th>
              <th style="text-align: right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="med in medicosFiltrados" :key="med.id">
              <td>
                <div style="display: flex; align-items: center; gap: 0.75rem">
                  <div
                    class="color-dot"
                    :style="{ background: med.color, width: '22px', height: '22px' }"
                  ></div>
                  <div>
                    <div style="font-weight: 800; color: var(--text-main); font-size: 1rem">
                      {{ med.nombre }}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">ID #{{ med.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :style="{
                    background: med.color + '22',
                    color: med.color,
                    border: `1px solid ${med.color}55`
                  }"
                >
                  {{ med.especialidad }}
                </span>
              </td>
              <td>
                <div style="font-size: 0.9rem; font-weight: 600">📞 {{ med.telefono || 'Sin teléfono' }}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted)">✉️ {{ med.email }}</div>
              </td>
              <td>
                <span class="badge" style="background: var(--surface-hover); color: var(--text-main); border: 1px solid var(--border)">
                  📅 {{ contarCitas(med.id) }} cita(s)
                </span>
              </td>
              <td style="text-align: right">
                <div class="actions" style="justify-content: flex-end">
                  <button
                    class="btn btn-ghost btn-sm"
                    title="Editar datos del médico"
                    @click="abrirModal(med)"
                  >
                    ✏️
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    title="Eliminar médico"
                    @click="solicitarEliminacion(med)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2. VISTA TARJETAS DE MÉDICOS -->
    <div v-else class="cards-grid">
      <div v-for="med in medicosFiltrados" :key="med.id" class="item-card">
        <div class="item-card-header">
          <div style="display: flex; align-items: center; gap: 0.75rem">
            <div
              class="user-avatar"
              :style="{ background: med.color, width: '42px', height: '42px', fontSize: '1.1rem' }"
            >
              {{ med.nombre.charAt(0) }}
            </div>
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main)">
                {{ med.nombre }}
              </div>
              <span
                class="badge"
                :style="{
                  background: med.color + '22',
                  color: med.color,
                  border: `1px solid ${med.color}44`,
                  marginTop: '0.25rem'
                }"
              >
                {{ med.especialidad }}
              </span>
            </div>
          </div>
        </div>

        <div class="item-card-body" style="background: var(--surface-hover); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border)">
          <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.25rem">
            <strong>📞 Teléfono:</strong> {{ med.telefono || 'No registrado' }}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.25rem">
            <strong>✉️ Email:</strong> {{ med.email }}
          </div>
          <div style="font-size: 0.85rem; color: var(--primary); font-weight: 700; margin-top: 0.4rem">
            📅 {{ contarCitas(med.id) }} cita(s) médica(s) asignada(s)
          </div>
        </div>

        <div class="item-card-footer">
          <div style="font-size: 0.8rem; color: var(--text-muted)">
            Especialista #{{ med.id }}
          </div>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" title="Editar" @click="abrirModal(med)">
              ✏️ Editar
            </button>
            <button class="btn btn-danger btn-sm" title="Eliminar" @click="solicitarEliminacion(med)">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear / Editar Médico -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ form.id ? '✏️ Editar Especialista' : '➕ Nuevo Especialista' }}
          </h2>
          <button class="modal-close" @click="cerrarModal">✕</button>
        </div>

        <div v-if="errorModal" class="alert alert-error">
          <span>⚠️</span> {{ errorModal }}
        </div>

        <div class="form-group">
          <label class="form-label">Nombre Completo y Título *</label>
          <input
            v-model="form.nombre"
            class="input"
            placeholder="Ej: Dra. Valeria Mendoza"
          />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Especialidad Médica *</label>
            <input
              v-model="form.especialidad"
              class="input"
              placeholder="Ej: Cardiología, Pediatría..."
            />
          </div>

          <div class="form-group">
            <label class="form-label">Color de Distintivo</label>
            <div style="display: flex; align-items: center; gap: 0.75rem">
              <input
                v-model="form.color"
                type="color"
                style="width: 46px; height: 38px; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; padding: 2px"
              />
              <span
                class="badge"
                :style="{ background: form.color + '22', color: form.color, border: `1px solid ${form.color}44` }"
              >
                Vista previa: {{ form.especialidad || 'Especialidad' }}
              </span>
            </div>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Correo Electrónico *</label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="medico@saludplus.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono de Contacto (Solo números)</label>
            <input
              v-model="form.telefono"
              type="tel"
              inputmode="numeric"
              maxlength="10"
              class="input"
              placeholder="Ej: 71234567"
              @input="form.telefono = form.telefono.replace(/\D/g, '')"
            />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="guardarMedico">
            <span v-if="guardando">Guardando...</span>
            <span v-else>{{ form.id ? 'Actualizar Datos' : 'Registrar Médico' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <ConfirmModal
      :visible="confirmModalVisible"
      title="¿Eliminar Médico Especialista?"
      :message="mensajeEliminacion"
      confirmText="Sí, eliminar"
      cancelText="Cancelar"
      type="danger"
      @confirm="ejecutarEliminacion"
      @cancel="confirmModalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../lib/axios'
import ConfirmModal from '../components/ConfirmModal.vue'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const medicos = ref([])
const citas = ref([])
const cargando = ref(true)
const guardando = ref(false)
const busqueda = ref('')
const tipoVista = ref('tabla') // 'tabla' o 'tarjetas'

// Estado de Modal
const modalVisible = ref(false)
const errorModal = ref('')

// Estado de Modal de Confirmación
const confirmModalVisible = ref(false)
const medicoAEliminar = ref(null)

const formVacio = () => ({
  id: null,
  nombre: '',
  especialidad: '',
  email: '',
  telefono: '',
  color: '#0284c7'
})

const form = ref(formVacio())

function manejarErrorAuth(error) {
  if (error.response?.status === 401) {
    auth.logout()
    router.push('/login')
    return true
  }
  return false
}

// ── Carga de Datos ──────────────────────────
async function cargarDatos() {
  cargando.value = true
  try {
    const [resMedicos, resCitas] = await Promise.all([
      api.get('/medicos'),
      api.get('/citas')
    ])
    medicos.value = resMedicos.data
    citas.value = resCitas.data
  } catch (error) {
    if (!manejarErrorAuth(error)) {
      toast.error('Error al cargar la información de especialistas')
    }
  } finally {
    cargando.value = false
  }
}

// ── Filtrado ────────────────────────────────
const medicosFiltrados = computed(() => {
  const query = busqueda.value.toLowerCase().trim()
  if (!query) return medicos.value

  return medicos.value.filter(
    (m) =>
      m.nombre.toLowerCase().includes(query) ||
      m.especialidad.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query)
  )
})

function contarCitas(medicoId) {
  return citas.value.filter((c) => c.medicoId == medicoId).length
}

const mensajeEliminacion = computed(() => {
  if (!medicoAEliminar.value) return ''
  const total = contarCitas(medicoAEliminar.value.id)
  return total > 0
    ? `⚠️ ATENCIÓN: El Dr(a). ${medicoAEliminar.value.nombre} tiene ${total} cita(s) médica(s) asignada(s). Si lo eliminas, esas citas quedarán sin médico. ¿Deseas continuar?`
    : `¿Estás seguro de que deseas eliminar al Dr(a). ${medicoAEliminar.value.nombre}? Esta acción no se puede revertir.`
})

// ── Modal & CRUD ────────────────────────────
function abrirModal(med = null) {
  form.value = med ? { ...med } : formVacio()
  errorModal.value = ''
  modalVisible.value = true
}

function cerrarModal() {
  modalVisible.value = false
}

async function guardarMedico() {
  if (!form.value.nombre.trim()) {
    errorModal.value = 'El nombre del médico es obligatorio.'
    return
  }
  if (!form.value.especialidad.trim()) {
    errorModal.value = 'La especialidad médica es obligatoria.'
    return
  }
  if (!form.value.email.trim()) {
    errorModal.value = 'El correo electrónico es obligatorio.'
    return
  }

  guardando.value = true
  errorModal.value = ''

  try {
    const payload = {
      nombre: form.value.nombre.trim(),
      especialidad: form.value.especialidad.trim(),
      email: form.value.email.trim(),
      telefono: form.value.telefono.trim(),
      color: form.value.color || '#0284c7'
    }

    if (form.value.id) {
      await api.put(`/medicos/${form.value.id}`, payload)
      toast.success('Datos del especialista actualizados')
    } else {
      await api.post('/medicos', payload)
      toast.success('Nuevo especialista registrado correctamente')
    }

    await cargarDatos()
    cerrarModal()
  } catch (error) {
    if (!manejarErrorAuth(error)) {
      errorModal.value = 'Error al guardar los datos del especialista.'
    }
  } finally {
    guardando.value = false
  }
}

function solicitarEliminacion(med) {
  medicoAEliminar.value = med
  confirmModalVisible.value = true
}

async function ejecutarEliminacion() {
  if (!medicoAEliminar.value) return
  confirmModalVisible.value = false

  try {
    await api.delete(`/medicos/${medicoAEliminar.value.id}`)
    toast.success(`Especialista ${medicoAEliminar.value.nombre} eliminado`)
    await cargarDatos()
  } catch (error) {
    if (!manejarErrorAuth(error)) {
      toast.error('Error al eliminar el médico')
    }
  } finally {
    medicoAEliminar.value = null
  }
}

onMounted(cargarDatos)
</script>
