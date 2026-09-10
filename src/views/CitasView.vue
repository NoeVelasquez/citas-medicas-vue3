<template>
  <div>
    <!-- Encabezado de la página -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span>📅</span> {{ auth.isAdmin ? 'Gestión Global de Citas' : auth.isRecepcion ? 'Recepción: Registro y Derivación' : 'Mis Citas y Pacientes' }}
        </h1>
        <p class="page-subtitle">
          {{ auth.isAdmin ? 'Supervisa y administra las consultas de todos los médicos de la clínica' : auth.isRecepcion ? 'Registra pacientes y deriva las consultas al médico o especialista correspondiente' : `Panel exclusivo de atención para ${medicoActual?.nombre || auth.user?.name}` }}
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap">
        <button class="btn btn-secondary" @click="exportarCSV" title="Exportar citas a archivo Excel/CSV">
          <span>📥</span> Exportar CSV
        </button>
        <button class="btn btn-primary" @click="abrirModal()">
          <span>➕</span> {{ auth.isRecepcion ? 'Registrar y Derivar Cita' : 'Nueva Cita' }}
        </button>
      </div>
    </div>

    <!-- Banner Informativo de Rol -->
    <div
      class="card"
      :style="{
        background: auth.isAdmin ? '#f0f9ff' : auth.isRecepcion ? '#fffbeb' : '#ecfdf5',
        borderColor: auth.isAdmin ? '#bae6fd' : auth.isRecepcion ? '#fde68a' : '#a7f3d0',
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
        <span style="font-size: 1.2rem">{{ auth.isAdmin ? '👑' : auth.isRecepcion ? '🛎️' : '🩺' }}</span>
        <div>
          <strong style="color: var(--text-main); font-size: 0.9rem">
            {{ auth.isAdmin ? 'Modo Administrador' : auth.isRecepcion ? 'Modo Recepción' : 'Modo Especialista Clínico' }}:
          </strong>
          <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.35rem">
            {{ auth.isAdmin ? 'Viendo todas las citas de la clínica con control total de horarios.' : auth.isRecepcion ? 'Panel de recepción para admisión de pacientes y asignación/derivación a especialistas.' : `Viendo únicamente tus pacientes asignados (${medicoActual?.especialidad || 'Especialista'}).` }}
          </span>
        </div>
      </div>
      <span
        class="badge"
        :style="{
          background: auth.isAdmin ? '#e0f2fe' : auth.isRecepcion ? '#fef3c7' : '#d1fae5',
          color: auth.isAdmin ? '#0369a1' : auth.isRecepcion ? '#92400e' : '#047857'
        }"
      >
        {{ auth.isAdmin ? 'Acceso Total' : auth.isRecepcion ? 'Recepción & Derivación' : 'Vista Personalizada' }}
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

      <!-- Filtro por Médico visible para Administrador y Recepción -->
      <select v-if="auth.isAdminOrRecepcion" v-model="filtroMedico" class="input">
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

      <!-- Selector de Orden (Obs 4: Más recientes primero por defecto) -->
      <select v-model="criterioOrden" class="input" title="Criterio de ordenamiento">
        <option value="reciente">🔽 Más recientes primero</option>
        <option value="antiguo">🔼 Más antiguas primero</option>
        <option value="paciente">🔤 Por Paciente (A-Z)</option>
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
        v-if="busqueda || filtroMedico || filtroEstado || criterioOrden !== 'reciente'"
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
        {{ auth.isAdminOrRecepcion ? 'Prueba ajustando los filtros de búsqueda o registra una nueva cita para derivación.' : 'No tienes citas agendadas con los filtros actuales.' }}
      </p>
    </div>

    <!-- 1. VISTA TABLA -->
    <div v-else-if="tipoVista === 'tabla'" class="table-container">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Médico Especialista (Derivado)</th>
              <th>Fecha y Hora</th>
              <th>Motivo / Conclusión</th>
              <th>Estado Rápido</th>
              <th>Costo</th>
              <th style="text-align: right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cita in citasFiltradas" :key="cita.id">
              <td>
                <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap">
                  <RouterLink
                    :to="`/citas/${cita.id}`"
                    style="text-decoration: none; color: var(--primary); font-weight: 700"
                  >
                    {{ cita.paciente }}
                  </RouterLink>
                  <span
                    v-if="cita.esRevision || (cita.motivo && cita.motivo.toLowerCase().includes('revisión'))"
                    class="badge"
                    style="background: #ede9fe; color: #6d28d9; font-size: 0.7rem; padding: 0.15rem 0.45rem"
                    title="Cita de Revisión Periódica / Control"
                  >
                    🔄 Revisión
                  </span>
                </div>
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
                <span v-else style="color: var(--text-muted); font-size: 0.85rem">Sin especialista asignado</span>
              </td>
              <td>
                <div style="font-weight: 700">{{ formatearFecha(cita.fecha) }}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted)">⏰ {{ cita.hora }}</div>
              </td>
              <td>
                <div style="max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis" :title="cita.motivo">
                  <strong>Motivo:</strong> {{ cita.motivo }}
                </div>
                <div v-if="cita.conclusion" style="font-size: 0.75rem; color: #047857; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis" :title="cita.conclusion">
                  ✅ <strong>Conclusión:</strong> {{ cita.conclusion }}
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
                    title="Ver detalle y registrar conclusión"
                  >
                    👁️
                  </RouterLink>
                  <button
                    class="btn btn-ghost btn-sm"
                    title="Programar Revisión Periódica / Control"
                    @click="abrirModalRevision(cita)"
                  >
                    🔄
                  </button>
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
            <div style="display: flex; align-items: center; gap: 0.4rem">
              <RouterLink
                :to="`/citas/${cita.id}`"
                style="text-decoration: none; color: var(--text-main); font-weight: 800; font-size: 1.1rem"
              >
                {{ cita.paciente }}
              </RouterLink>
              <span
                v-if="cita.esRevision || (cita.motivo && cita.motivo.toLowerCase().includes('revisión'))"
                class="badge"
                style="background: #ede9fe; color: #6d28d9; font-size: 0.7rem; padding: 0.15rem 0.45rem"
              >
                🔄 Revisión
              </span>
            </div>
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
            <strong>Motivo:</strong> {{ cita.motivo }}
          </p>
          <p v-if="cita.conclusion" style="font-size: 0.8rem; line-height: 1.4; color: #047857; margin-top: 0.35rem; background: #ecfdf5; padding: 0.35rem 0.5rem; border-radius: var(--radius-sm)">
            ✅ <strong>Conclusión:</strong> {{ cita.conclusion }}
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
            <button class="btn btn-ghost btn-sm" title="Programar Revisión Periódica" @click="abrirModalRevision(cita)">
              🔄
            </button>
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

    <!-- Modal para Crear / Editar Cita / Agendar Revisión -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            <span v-if="modoRevision">🔄 Programar Revisión Periódica / Control</span>
            <span v-else-if="form.id">✏️ Editar Cita Médica</span>
            <span v-else>➕ {{ auth.isRecepcion ? 'Registrar y Derivar Cita Médica' : 'Nueva Cita Médica' }}</span>
          </h2>
          <button class="modal-close" @click="cerrarModal">✕</button>
        </div>

        <div v-if="errorModal" class="alert alert-error">
          <span>⚠️</span> {{ errorModal }}
        </div>

        <!-- Banner de Revisión Periódica -->
        <div
          v-if="modoRevision"
          style="background: #ede9fe; border: 1px solid #ddd6fe; padding: 0.75rem 1rem; border-radius: var(--radius); margin-bottom: 1rem; font-size: 0.85rem; color: #5b21b6"
        >
          <strong>🩺 Revisión Periódica para:</strong> {{ form.paciente }}
          <div style="margin-top: 0.4rem; display: flex; gap: 0.4rem; flex-wrap: wrap">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              style="font-size: 0.75rem; background: white"
              @click="fijarFechaRevision(7)"
            >
              +7 Días (Control Rápido)
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              style="font-size: 0.75rem; background: white"
              @click="fijarFechaRevision(15)"
            >
              +15 Días (Quincenal)
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              style="font-size: 0.75rem; background: white"
              @click="fijarFechaRevision(30)"
            >
              +30 Días (1 Mes)
            </button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              style="font-size: 0.75rem; background: white"
              @click="fijarFechaRevision(90)"
            >
              +90 Días (Trimestral)
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nombre del Paciente *</label>
          <input
            v-model="form.paciente"
            class="input"
            placeholder="Ej: Juan Carlos Morales"
            :disabled="modoRevision"
          />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              {{ auth.isRecepcion ? 'Médico Especialista (Derivar a) *' : 'Médico Especialista *' }}
            </label>
            <select
              v-model="form.medicoId"
              class="input"
            >
              <option :value="null" disabled>Seleccione un especialista</option>
              <option v-for="med in medicos" :key="med.id" :value="med.id">
                {{ med.nombre }} ({{ med.especialidad }})
              </option>
            </select>
            <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 0.25rem">
              {{ auth.isRecepcion ? '🛎️ Recepción deriva al médico seleccionado.' : 'Especialista asignado a la atención.' }}
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

        <div v-if="form.id && form.estado === 'Atendida'" class="form-group">
          <label class="form-label">📝 Conclusión Médica Registrada</label>
          <textarea
            v-model="form.conclusion"
            class="input"
            rows="2"
            placeholder="Diagnóstico y observaciones del médico especialista..."
            style="resize: vertical"
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="guardarCita">
            <span v-if="guardando">Guardando...</span>
            <span v-else-if="modoRevision">🔄 Programar Revisión</span>
            <span v-else>{{ form.id ? 'Actualizar Cita' : (auth.isRecepcion ? 'Derivar y Guardar Cita' : 'Crear Cita') }}</span>
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
import {
  evaluarTransicionEstado,
  detectarConflictoHorario,
  ordenarCitas,
  calcularFechaRevision
} from '../lib/validation'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const citas = ref([])
const medicos = ref([])
const cargando = ref(true)
const guardando = ref(false)
const tipoVista = ref('tabla') // 'tabla' o 'tarjetas'

// Estados de Filtro, Búsqueda y Orden (Obs 4: más reciente primero por defecto)
const busqueda = ref('')
const filtroMedico = ref('')
const filtroEstado = ref('')
const criterioOrden = ref('reciente')

// Modal Crear/Editar y Revisiones
const modalVisible = ref(false)
const modoRevision = ref(false)
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
  if (auth.isAdminOrRecepcion) {
    return citas.value
  }

  const targetMedicoId = medicoActual.value?.id || auth.currentMedicoId
  if (!targetMedicoId) {
    return citas.value
  }

  return citas.value.filter((c) => c.medicoId == targetMedicoId)
})

// ── Filtrado con Buscador, Filtros y Ordenamiento (Obs 4) ─────────
const citasFiltradas = computed(() => {
  const filtradas = citasFiltradasPorRol.value.filter((c) => {
    const query = busqueda.value.toLowerCase().trim()
    const matchBusqueda =
      !query ||
      c.paciente.toLowerCase().includes(query) ||
      (c.motivo && c.motivo.toLowerCase().includes(query)) ||
      (c.conclusion && c.conclusion.toLowerCase().includes(query))

    const matchMedico = !filtroMedico.value || c.medicoId == filtroMedico.value
    const matchEstado = !filtroEstado.value || c.estado === filtroEstado.value

    return matchBusqueda && matchMedico && matchEstado
  })

  return ordenarCitas(filtradas, criterioOrden.value)
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
  criterioOrden.value = 'reciente'
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

  const cabeceras = ['ID', 'Paciente', 'Medico', 'Especialidad', 'Fecha', 'Hora', 'Estado', 'Costo', 'Motivo', 'Conclusión']
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
      `"${(c.motivo || '').replace(/"/g, '""')}"`,
      `"${(c.conclusion || '').replace(/"/g, '""')}"`
    ]
  })

  const csvContent = '\uFEFF' + [cabeceras.join(','), ...filas.map((e) => e.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `citas_${auth.isAdminOrRecepcion ? 'todas' : 'especialista'}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('Reporte CSV exportado exitosamente')
}

// ── Revisiones Periódicas (Obs 3) ────────────
function fijarFechaRevision(dias) {
  form.value.fecha = calcularFechaRevision(form.value.fecha, dias)
  toast.info(`Fecha de revisión ajustada a +${dias} días (${formatearFecha(form.value.fecha)})`)
}

function abrirModalRevision(cita) {
  modoRevision.value = true
  const fechaSugerida = calcularFechaRevision(cita.fecha || new Date().toISOString().slice(0, 10), 15)
  form.value = {
    id: null,
    paciente: cita.paciente,
    medicoId: cita.medicoId || (medicos.value.length > 0 ? medicos.value[0].id : null),
    fecha: fechaSugerida,
    hora: cita.hora || '10:00',
    motivo: `Revisión periódica y control de evolución (Seguimiento cita #${cita.id})`,
    estado: 'Pendiente',
    costo: Math.round((Number(cita.costo) || 150) * 0.8), // Tarifa preferencial de revisión
    esRevision: true,
    citaPadreId: cita.id,
    conclusion: ''
  }
  errorModal.value = ''
  modalVisible.value = true
}

// ── Modal & CRUD ────────────────────────────
function abrirModal(cita = null) {
  modoRevision.value = false
  if (cita) {
    form.value = { ...cita }
  } else {
    form.value = formVacio()
    if (auth.isAdminOrRecepcion && medicos.value.length > 0) {
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
  modoRevision.value = false
}

async function guardarCita() {
  if (!form.value.paciente.trim()) {
    errorModal.value = 'El nombre del paciente es obligatorio.'
    return
  }
  if (!form.value.medicoId) {
    errorModal.value = 'Debe seleccionar un médico especialista para la derivación.'
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
      costo: Number(form.value.costo) || 0,
      conclusion: form.value.conclusion ? form.value.conclusion.trim() : (form.value.id ? form.value.conclusion : null),
      esRevision: form.value.esRevision || false,
      citaPadreId: form.value.citaPadreId || null
    }

    if (form.value.id) {
      await api.put(`/citas/${form.value.id}`, payload)
      toast.success('Cita médica actualizada correctamente')
    } else {
      await api.post('/citas', payload)
      if (modoRevision.value) {
        toast.success(`Revisión periódica agendada para ${payload.paciente} el ${formatearFecha(payload.fecha)}`)
      } else if (auth.isRecepcion) {
        const med = getMedico(payload.medicoId)
        toast.success(`Cita registrada y derivada exitosamente a ${med?.nombre || 'Especialista'}`)
      } else {
        toast.success('Nueva cita médica agendada con éxito')
      }
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
