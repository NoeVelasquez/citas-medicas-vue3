<template>
  <div>
    <!-- Encabezado de la página -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span>📅</span> {{ auth.isAdmin ? 'Gestión Global de Citas' : 'Mis Citas y Pacientes' }}
        </h1>
        <p class="page-subtitle">
          {{ auth.isAdmin ? 'Supervisa y administra las consultas de todos los médicos de la clínica' : `Panel exclusivo de atención para ${medicoActual?.nombre || auth.user?.name}` }}
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap">
        <button class="btn btn-secondary" @click="exportarCSV" title="Exportar citas a archivo Excel/CSV">
          <span>📥</span> Exportar CSV
        </button>
        <button class="btn btn-primary" @click="abrirModal()">
          <span>➕</span> Nueva Cita
        </button>
      </div>
    </div>

    <!-- Banner Informativo de Rol -->
    <div
      class="card"
      :style="{
        background: auth.isAdmin ? '#f0f9ff' : '#ecfdf5',
        borderColor: auth.isAdmin ? '#bae6fd' : '#a7f3d0',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }"
    >
      <div style="display: flex; align-items: center; gap: 0.6rem">
        <span style="font-size: 1.2rem">{{ auth.isAdmin ? '👑' : '🩺' }}</span>
        <div>
          <strong style="color: var(--text-main); font-size: 0.9rem">
            {{ auth.isAdmin ? 'Modo Administrador' : 'Modo Especialista Clínico' }}:
          </strong>
          <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.35rem">
            {{ auth.isAdmin ? 'Viendo todas las citas de la clínica con control total de horarios.' : `Viendo únicamente tus pacientes asignados (${medicoActual?.especialidad || 'Especialista'}).` }}
          </span>
        </div>
      </div>
      <span
        class="badge"
        :style="{
          background: auth.isAdmin ? '#e0f2fe' : '#d1fae5',
          color: auth.isAdmin ? '#0369a1' : '#047857'
        }"
      >
        {{ auth.isAdmin ? 'Acceso Total' : 'Vista Personalizada' }}
      </span>
    </div>

    <!-- Tarjetas de Estadísticas Rápidas (KPIs) -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--primary-light); color: var(--primary)">📅</div>
        <div class="stat-info">
          <span class="stat-number">{{ citasFiltradasPorRol.length }}</span>
          <span class="stat-label">{{ auth.isAdmin ? 'Total Citas' : 'Mis Citas' }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--warning-light); color: #b45309">⏳</div>
        <div class="stat-info">
          <span class="stat-number">{{ contarPorEstado('Pendiente') }}</span>
          <span class="stat-label">Pendientes</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--success-light); color: var(--success)">✅</div>
        <div class="stat-info">
          <span class="stat-number">{{ contarPorEstado('Atendida') }}</span>
          <span class="stat-label">Atendidas</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ede9fe; color: #7c3aed">💰</div>
        <div class="stat-info">
          <span class="stat-number">Bs. {{ totalIngresos }}</span>
          <span class="stat-label">Honorarios Calculados</span>
        </div>
      </div>
    </div>

    <!-- Barra de Buscador, Filtros y Switcher de Vista -->
    <div class="filters-bar">
      <input
        v-model="busqueda"
        class="input input-search"
        placeholder="🔍 Buscar por paciente o motivo de consulta..."
      />

      <!-- Filtro por Médico solo visible para Administrador -->
      <select v-if="auth.isAdmin" v-model="filtroMedico" class="input">
        <option value="">👨‍⚕️ Todos los médicos</option>
        <option v-for="med in medicos" :key="med.id" :value="med.id">
          {{ med.nombre }} ({{ med.especialidad }})
        </option>
      </select>

      <select v-model="filtroEstado" class="input">
        <option value="">📌 Todos los estados</option>
        <option value="Pendiente">Pendiente</option>
        <option value="Confirmada">Confirmada</option>
        <option value="Atendida">Atendida</option>
        <option value="Cancelada">Cancelada</option>
      </select>

      <!-- Selector de Vista (Tabla vs Tarjetas) -->
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
          title="Vista de Tarjetas / Agenda"
        >
          🗂️ Tarjetas
        </button>
      </div>

      <button
        v-if="busqueda || filtroMedico || filtroEstado"
        class="btn btn-ghost btn-sm"
        @click="limpiarFiltros"
      >
        ✕ Limpiar
      </button>
    </div>

    <!-- Estado de Carga y Vacío -->
    <div v-if="cargando" class="card empty-state">
      <p>Cargando información de citas médicas...</p>
    </div>

    <div v-else-if="citasFiltradas.length === 0" class="card empty-state">
      <div class="empty-icon">📂</div>
      <h3>No se encontraron citas médicas</h3>
      <p>
        {{ auth.isAdmin ? 'Prueba ajustando los filtros de búsqueda o registra una nueva cita.' : 'No tienes citas agendadas con los filtros actuales.' }}
      </p>
    </div>

    <!-- 1. VISTA TABLA -->
    <div v-else-if="tipoVista === 'tabla'" class="table-container">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Médico Especialista</th>
              <th>Fecha y Hora</th>
              <th>Motivo de Consulta</th>
              <th>Estado Rápido</th>
              <th>Costo</th>
              <th style="text-align: right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cita in citasFiltradas" :key="cita.id">
              <td>
                <RouterLink
                  :to="`/citas/${cita.id}`"
                  style="text-decoration: none; color: var(--primary); font-weight: 700"
                >
                  {{ cita.paciente }}
                </RouterLink>
                <div style="font-size: 0.75rem; color: var(--text-muted)">Cita #{{ cita.id }}</div>
              </td>
              <td>
                <div v-if="getMedico(cita.medicoId)" style="display: flex; align-items: center; gap: 0.5rem">
                  <span
                    class="color-dot"
                    :style="{ background: getMedico(cita.medicoId).color, width: '12px', height: '12px' }"
                  ></span>
                  <div>
                    <div style="font-weight: 700">{{ getMedico(cita.medicoId).nombre }}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">
                      {{ getMedico(cita.medicoId).especialidad }}
                    </div>
                  </div>
                </div>
                <span v-else style="color: var(--text-muted); font-size: 0.85rem">Sin médico</span>
              </td>
              <td>
                <div style="font-weight: 700">{{ formatearFecha(cita.fecha) }}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted)">⏰ {{ cita.hora }}</div>
              </td>
              <td>
                <div style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis" :title="cita.motivo">
                  {{ cita.motivo }}
                </div>
              </td>
              <td>
                <!-- Selector rápido de estado con validación de máquina de estados -->
                <select
                  :value="cita.estado"
                  class="badge"
                  :class="getBadgeClase(cita.estado)"
                  style="cursor: pointer; border-radius: 9999px; outline: none"
                  @change="solicitarCambioEstado(cita, $event.target.value)"
                  title="Cambiar estado de consulta"
                >
                  <option value="Pendiente">⏳ Pendiente</option>
                  <option value="Confirmada">📋 Confirmada</option>
                  <option value="Atendida">✅ Atendida</option>
                  <option value="Cancelada">❌ Cancelada</option>
                </select>
              </td>
              <td style="font-weight: 800; color: var(--text-main)">
                Bs. {{ cita.costo || 0 }}
              </td>
              <td style="text-align: right">
                <div class="actions" style="justify-content: flex-end">
                  <RouterLink
                    :to="`/citas/${cita.id}`"
                    class="btn btn-ghost btn-sm"
                    title="Ver detalle completo"
                  >
                    👁️
                  </RouterLink>
                  <button
                    class="btn btn-ghost btn-sm"
                    title="Editar cita"
                    @click="abrirModal(cita)"
                  >
                    ✏️
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    title="Eliminar cita"
                    @click="solicitarEliminacion(cita)"
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

    <!-- 2. VISTA TARJETAS / AGENDA -->
    <div v-else class="cards-grid">
      <div v-for="cita in citasFiltradas" :key="cita.id" class="item-card">
        <div class="item-card-header">
          <div>
            <RouterLink
              :to="`/citas/${cita.id}`"
              style="text-decoration: none; color: var(--text-main); font-weight: 800; font-size: 1.1rem"
            >
              {{ cita.paciente }}
            </RouterLink>
            <div style="font-size: 0.8rem; color: var(--text-muted)">
              📅 {{ formatearFecha(cita.fecha) }} • ⏰ {{ cita.hora }}
            </div>
          </div>
          <span class="badge" :class="getBadgeClase(cita.estado)">
            {{ cita.estado }}
          </span>
        </div>

        <div class="item-card-body">
          <div v-if="getMedico(cita.medicoId)" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem">
            <span
              class="color-dot"
              :style="{ background: getMedico(cita.medicoId).color, width: '12px', height: '12px' }"
            ></span>
            <span style="font-weight: 600; color: var(--text-main)">
              {{ getMedico(cita.medicoId).nombre }}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted)">
              ({{ getMedico(cita.medicoId).especialidad }})
            </span>
          </div>

          <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-muted); margin-top: 0.35rem">
            {{ cita.motivo }}
          </p>
        </div>

        <div class="item-card-footer">
          <div style="font-weight: 800; color: var(--primary)">
            Bs. {{ cita.costo || 0 }}
          </div>
          <div class="actions">
            <RouterLink :to="`/citas/${cita.id}`" class="btn btn-ghost btn-sm" title="Ver detalle">
              👁️
            </RouterLink>
            <button class="btn btn-ghost btn-sm" title="Editar" @click="abrirModal(cita)">
              ✏️
            </button>
            <button class="btn btn-danger btn-sm" title="Eliminar" @click="solicitarEliminacion(cita)">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Crear / Editar Cita -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ form.id ? '✏️ Editar Cita Médica' : '➕ Nueva Cita Médica' }}
          </h2>
          <button class="modal-close" @click="cerrarModal">✕</button>
        </div>

        <div v-if="errorModal" class="alert alert-error">
          <span>⚠️</span> {{ errorModal }}
        </div>

        <div class="form-group">
          <label class="form-label">Nombre del Paciente *</label>
          <input
            v-model="form.paciente"
            class="input"
            placeholder="Ej: Juan Carlos Morales"
          />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Médico Especialista *</label>
            <select
              v-model="form.medicoId"
              class="input"
              :disabled="!auth.isAdmin"
            >
              <option :value="null" disabled>Seleccione un médico</option>
              <option v-for="med in medicos" :key="med.id" :value="med.id">
                {{ med.nombre }} ({{ med.especialidad }})
              </option>
            </select>
            <small v-if="!auth.isAdmin" style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 0.25rem">
              Asignado automáticamente a su perfil médico
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">Estado de la Cita</label>
            <select v-model="form.estado" class="input">
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="Confirmada">📋 Confirmada</option>
              <option value="Atendida">✅ Atendida</option>
              <option value="Cancelada">❌ Cancelada</option>
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Fecha de Consulta *</label>
            <input v-model="form.fecha" type="date" class="input" />
          </div>

          <div class="form-group">
            <label class="form-label">Hora *</label>
            <input v-model="form.hora" type="time" class="input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Costo de Consulta (Bs.) *</label>
          <input
            v-model.number="form.costo"
            type="number"
            min="0"
            step="10"
            class="input"
            placeholder="Ej: 200"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Motivo o Diagnóstico Preliminar *</label>
          <textarea
            v-model="form.motivo"
            class="input"
            rows="3"
            placeholder="Describa el motivo de la consulta o síntomas del paciente..."
            style="resize: vertical"
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="guardarCita">
            <span v-if="guardando">Guardando...</span>
            <span v-else>{{ form.id ? 'Actualizar Cita' : 'Crear Cita' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Transición Crítica / Reversión -->
    <ConfirmModal
      :visible="confirmTransicionVisible"
      title="Confirmar Cambio Crítico de Estado"
      :message="advertenciaTransicion"
      confirmText="Sí, cambiar estado"
      cancelText="Mantener como estaba"
      type="warning"
      @confirm="ejecutarCambioEstadoCritico"
      @cancel="cancelarCambioEstadoCritico"
    />

    <!-- Modal de Confirmación de Eliminación -->
    <ConfirmModal
      :visible="confirmModalVisible"
      title="¿Eliminar Cita Médica?"
      :message="`¿Estás seguro de que deseas eliminar la cita del paciente ${citaAEliminar?.paciente}? Esta acción no se puede revertir.`"
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
import { evaluarTransicionEstado, detectarConflictoHorario } from '../lib/validation'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const citas = ref([])
const medicos = ref([])
const cargando = ref(true)
const guardando = ref(false)
const tipoVista = ref('tabla') // 'tabla' o 'tarjetas'

// Estados de Filtro y Búsqueda
const busqueda = ref('')
const filtroMedico = ref('')
const filtroEstado = ref('')

// Modal Crear/Editar
const modalVisible = ref(false)
const errorModal = ref('')

// Modal Confirmación Eliminación
const confirmModalVisible = ref(false)
const citaAEliminar = ref(null)

// Modal Confirmación Transición Crítica
const confirmTransicionVisible = ref(false)
const advertenciaTransicion = ref('')
const transicionPendiente = ref(null)

const medicoActual = computed(() => {
  if (auth.isAdmin) return null
  return (
    medicos.value.find((m) => m.id == auth.currentMedicoId) ||
    medicos.value.find((m) => m.email?.toLowerCase() === auth.user?.email?.toLowerCase()) ||
    medicos.value.find((m) => m.nombre?.toLowerCase().includes(auth.user?.name?.toLowerCase())) ||
    null
  )
})

const formVacio = () => ({
  id: null,
  paciente: '',
  medicoId: medicoActual.value ? medicoActual.value.id : null,
  fecha: new Date().toISOString().slice(0, 10),
  hora: '09:00',
  motivo: '',
  estado: 'Pendiente',
  costo: 150
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
    const [resCitas, resMedicos] = await Promise.all([
      api.get('/citas'),
      api.get('/medicos')
    ])
    citas.value = resCitas.data
    medicos.value = resMedicos.data
  } catch (error) {
    if (!manejarErrorAuth(error)) {
      toast.error('Error al sincronizar datos del servidor')
    }
  } finally {
    cargando.value = false
  }
}

// ── Filtrado Base por Rol ───────────────────
const citasFiltradasPorRol = computed(() => {
  if (auth.isAdmin) {
    return citas.value
  }

  const targetMedicoId = medicoActual.value?.id || auth.currentMedicoId
  if (!targetMedicoId) {
    return citas.value
  }

  return citas.value.filter((c) => c.medicoId == targetMedicoId)
})

// ── Filtrado con Buscador y Filtros ─────────
const citasFiltradas = computed(() => {
  return citasFiltradasPorRol.value.filter((c) => {
    const query = busqueda.value.toLowerCase().trim()
    const matchBusqueda =
      !query ||
      c.paciente.toLowerCase().includes(query) ||
      (c.motivo && c.motivo.toLowerCase().includes(query))

    const matchMedico = !filtroMedico.value || c.medicoId == filtroMedico.value
    const matchEstado = !filtroEstado.value || c.estado === filtroEstado.value

    return matchBusqueda && matchMedico && matchEstado
  })
})

const totalIngresos = computed(() => {
  return citasFiltradasPorRol.value
    .filter((c) => c.estado !== 'Cancelada')
    .reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0)
})

// ── Helpers ─────────────────────────────────
function getMedico(id) {
  return medicos.value.find((m) => m.id == id) || null
}

function contarPorEstado(estado) {
  return citasFiltradasPorRol.value.filter((c) => c.estado === estado).length
}

function getBadgeClase(estado) {
  switch (estado) {
    case 'Confirmada':
      return 'badge-confirmada'
    case 'Atendida':
      return 'badge-atendida'
    case 'Cancelada':
      return 'badge-cancelada'
    default:
      return 'badge-pendiente'
  }
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return ''
  const [y, m, d] = fechaStr.split('-')
  return `${d}/${m}/${y}`
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroMedico.value = ''
  filtroEstado.value = ''
}

// ── Transiciones de Estado con Máquina de Estados (QA Edge Case) ──
function solicitarCambioEstado(cita, nuevoEstado) {
  const evaluacion = evaluarTransicionEstado(cita.estado, nuevoEstado)

  if (!evaluacion.permitido) {
    toast.error('Transición de estado no permitida.')
    return
  }

  if (evaluacion.esCritica) {
    advertenciaTransicion.value = evaluacion.advertencia
    transicionPendiente.value = { cita, nuevoEstado }
    confirmTransicionVisible.value = true
  } else {
    ejecutarCambioEstadoDirecto(cita, nuevoEstado)
  }
}

async function ejecutarCambioEstadoDirecto(cita, nuevoEstado) {
  try {
    const payload = { ...cita, estado: nuevoEstado }
    await api.put(`/citas/${cita.id}`, payload)
    cita.estado = nuevoEstado
    toast.info(`Estado actualizado a "${nuevoEstado}"`)
  } catch {
    toast.error('Error al actualizar el estado de la cita')
  }
}

async function ejecutarCambioEstadoCritico() {
  if (!transicionPendiente.value) return
  const { cita, nuevoEstado } = transicionPendiente.value
  confirmTransicionVisible.value = false
  await ejecutarCambioEstadoDirecto(cita, nuevoEstado)
  transicionPendiente.value = null
}

function cancelarCambioEstadoCritico() {
  confirmTransicionVisible.value = false
  transicionPendiente.value = null
  // Forzar re-render de la cita para resetear el select
  cargarDatos()
}

// ── Exportación a CSV ───────────────────────
function exportarCSV() {
  if (citasFiltradas.value.length === 0) {
    toast.warning('No hay citas para exportar con los filtros actuales')
    return
  }

  const cabeceras = ['ID', 'Paciente', 'Medico', 'Especialidad', 'Fecha', 'Hora', 'Estado', 'Costo', 'Motivo']
  const filas = citasFiltradas.value.map((c) => {
    const med = getMedico(c.medicoId)
    return [
      c.id,
      `"${c.paciente.replace(/"/g, '""')}"`,
      `"${(med?.nombre || 'Sin asignar').replace(/"/g, '""')}"`,
      `"${(med?.especialidad || '').replace(/"/g, '""')}"`,
      c.fecha,
      c.hora,
      c.estado,
      c.costo,
      `"${(c.motivo || '').replace(/"/g, '""')}"`
    ]
  })

  const csvContent = '\uFEFF' + [cabeceras.join(','), ...filas.map((e) => e.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `citas_${auth.isAdmin ? 'todas' : 'especialista'}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('Reporte CSV exportado exitosamente')
}

// ── Modal & CRUD ────────────────────────────
function abrirModal(cita = null) {
  if (cita) {
    form.value = { ...cita }
  } else {
    form.value = formVacio()
    if (auth.isAdmin && medicos.value.length > 0) {
      form.value.medicoId = medicos.value[0].id
    } else if (medicoActual.value) {
      form.value.medicoId = medicoActual.value.id
    }
  }
  errorModal.value = ''
  modalVisible.value = true
}

function cerrarModal() {
  modalVisible.value = false
}

async function guardarCita() {
  if (!form.value.paciente.trim()) {
    errorModal.value = 'El nombre del paciente es obligatorio.'
    return
  }
  if (!form.value.medicoId) {
    errorModal.value = 'Debe seleccionar un médico especialista.'
    return
  }
  if (!form.value.fecha || !form.value.hora) {
    errorModal.value = 'La fecha y hora son obligatorias.'
    return
  }
  if (form.value.costo < 0) {
    errorModal.value = 'El costo de la consulta no puede ser negativo.'
    return
  }
  if (!form.value.motivo.trim()) {
    errorModal.value = 'El motivo de consulta es obligatorio.'
    return
  }

  // ── QA Check: Detección de Conflicto de Horarios (Double Booking) ──
  const conflicto = detectarConflictoHorario(form.value, citas.value)
  if (conflicto.tieneConflicto) {
    const med = getMedico(form.value.medicoId)
    errorModal.value = `⚠️ Conflicto de Horario: El Dr(a). ${med?.nombre || 'seleccionado'} ya tiene una consulta agendada el ${formatearFecha(form.value.fecha)} a las ${form.value.hora} con el paciente "${conflicto.citaConflicto?.paciente}". Por favor elige otro horario.`
    toast.warning('Conflicto de horario detectado con otra cita médica')
    return
  }

  guardando.value = true
  errorModal.value = ''

  try {
    const payload = {
      paciente: form.value.paciente.trim(),
      medicoId: Number(form.value.medicoId),
      fecha: form.value.fecha,
      hora: form.value.hora,
      motivo: form.value.motivo.trim(),
      estado: form.value.estado,
      costo: Number(form.value.costo) || 0
    }

    if (form.value.id) {
      await api.put(`/citas/${form.value.id}`, payload)
      toast.success('Cita médica actualizada correctamente')
    } else {
      await api.post('/citas', payload)
      toast.success('Nueva cita médica agendada con éxito')
    }

    await cargarDatos()
    cerrarModal()
  } catch (error) {
    if (!manejarErrorAuth(error)) {
      errorModal.value = 'Ocurrió un error al guardar la cita médica.'
    }
  } finally {
    guardando.value = false
  }
}

function solicitarEliminacion(cita) {
  citaAEliminar.value = cita
  confirmModalVisible.value = true
}

async function ejecutarEliminacion() {
  if (!citaAEliminar.value) return
  confirmModalVisible.value = false

  try {
    await api.delete(`/citas/${citaAEliminar.value.id}`)
    toast.success(`Cita de ${citaAEliminar.value.paciente} eliminada`)
    await cargarDatos()
  } catch (error) {
    if (!manejarErrorAuth(error)) {
      toast.error('Error al eliminar la cita médica')
    }
  } finally {
    citaAEliminar.value = null
  }
}

onMounted(cargarDatos)
</script>
