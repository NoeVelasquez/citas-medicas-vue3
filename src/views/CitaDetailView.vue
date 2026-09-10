<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem">
      <RouterLink to="/citas" class="btn btn-secondary btn-sm">
        ← Volver al listado de citas
      </RouterLink>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
        <button class="btn btn-secondary btn-sm" @click="abrirModalRevision" title="Programar control o revisión periódica">
          🔄 Agendar Revisión Periódica
        </button>
        <button class="btn btn-secondary btn-sm" @click="imprimirFicha" title="Imprimir comprobante médico">
          🖨️ Imprimir Ficha de Cita
        </button>
      </div>
    </div>

    <div v-if="cargando" class="card empty-state">
      <p style="color: var(--text-muted)">Cargando detalle de la cita médica...</p>
    </div>

    <div v-else-if="!cita" class="card empty-state">
      <div class="empty-icon">⚠️</div>
      <h2>Cita Médica no encontrada</h2>
      <p>El registro solicitado no existe o fue eliminado.</p>
      <RouterLink to="/citas" class="btn btn-primary" style="margin-top: 1rem">
        Ir a Citas Médicas
      </RouterLink>
    </div>

    <div v-else class="card" style="position: relative">
      <!-- Encabezado del Detalle -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.5rem">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap">
            <h1 style="font-size: 1.7rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em">
              {{ cita.paciente }}
            </h1>
            <span class="badge" :class="getBadgeClase(cita.estado)">
              {{ cita.estado }}
            </span>
            <span
              v-if="cita.esRevision || (cita.motivo && cita.motivo.toLowerCase().includes('revisión'))"
              class="badge"
              style="background: #ede9fe; color: #6d28d9; font-weight: 700"
            >
              🔄 Revisión Periódica
            </span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem">
            Comprobante de Cita Médica <code>#{{ cita.id }}</code> • Clínica SaludPlus
          </p>
        </div>

        <div class="actions">
          <button class="btn btn-secondary btn-sm" @click="abrirModal">
            ✏️ Editar Cita
          </button>
          <button class="btn btn-danger btn-sm" @click="confirmModalVisible = true">
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <!-- Barra de Acciones Rápidas de Estado -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; background: var(--surface-hover); padding: 0.75rem 1rem; border-radius: var(--radius); border: 1px solid var(--border)">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-right: 0.5rem">
          ⚡ Cambiar Estado:
        </span>
        <button
          v-if="cita.estado !== 'Confirmada'"
          class="btn btn-secondary btn-sm"
          @click="cambiarEstado('Confirmada')"
        >
          📋 Marcar Confirmada
        </button>
        <button
          v-if="cita.estado !== 'Atendida'"
          class="btn btn-primary btn-sm"
          style="background: #10b981; border: none"
          @click="cambiarEstado('Atendida')"
        >
          ✅ Marcar Atendida (Finalizar Consulta)
        </button>
        <button
          v-if="cita.estado !== 'Cancelada'"
          class="btn btn-danger btn-sm"
          @click="cambiarEstado('Cancelada')"
        >
          ❌ Cancelar Cita
        </button>
        <button
          v-if="cita.estado !== 'Pendiente'"
          class="btn btn-ghost btn-sm"
          @click="cambiarEstado('Pendiente')"
        >
          ⏳ Volver a Pendiente
        </button>
      </div>

      <!-- Grid de Información -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem">
        <!-- Médico Asignado -->
        <div style="background: var(--surface-hover); padding: 1.35rem; border-radius: var(--radius); border: 1px solid var(--border)">
          <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem">
            👨‍⚕️ Médico Especialista (Derivación)
          </div>
          <div v-if="medico">
            <div style="display: flex; align-items: center; gap: 0.6rem">
              <span
                class="color-dot"
                :style="{ background: medico.color, width: '16px', height: '16px' }"
              ></span>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main)">
                {{ medico.nombre }}
              </div>
            </div>
            <div style="margin-top: 0.4rem; font-size: 0.9rem; color: var(--text-muted)">
              Especialidad: <strong style="color: var(--text-main)">{{ medico.especialidad }}</strong>
            </div>
            <div style="margin-top: 0.3rem; font-size: 0.85rem; color: var(--text-muted)">
              📞 {{ medico.telefono }} • ✉️ {{ medico.email }}
            </div>
          </div>
          <div v-else style="color: var(--text-muted)">
            Sin médico especialista asignado
          </div>
        </div>

        <!-- Horario y Costo -->
        <div style="background: var(--surface-hover); padding: 1.35rem; border-radius: var(--radius); border: 1px solid var(--border)">
          <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem">
            ⏰ Programación y Honorarios
          </div>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main)">
            📅 {{ formatearFecha(cita.fecha) }} • ⏰ {{ cita.hora }}
          </div>
          <div style="margin-top: 0.6rem; font-size: 1rem; color: var(--text-main)">
            Costo de Consulta:
            <strong style="color: var(--primary); font-size: 1.25rem; margin-left: 0.3rem">
              Bs. {{ cita.costo || 0 }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Motivo o Diagnóstico Preliminar -->
      <div style="margin-top: 1.5rem; padding: 1.35rem; background: var(--surface-hover); border-radius: var(--radius); border: 1px solid var(--border)">
        <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem">
          📋 Motivo de Consulta y Síntomas Reportados
        </div>
        <p style="font-size: 0.975rem; line-height: 1.6; color: var(--text-main); white-space: pre-wrap">
          {{ cita.motivo || 'No se registraron observaciones adicionales.' }}
        </p>
      </div>

      <!-- Obs 2: Módulo Clínico de Conclusión de la Consulta Médica -->
      <div style="margin-top: 1.5rem; padding: 1.35rem; background: #f0fdf4; border-radius: var(--radius); border: 1px solid #bbf7d0">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem">
          <div style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: #15803d; display: flex; align-items: center; gap: 0.4rem">
            <span>📝</span> Conclusión Médica, Diagnóstico y Tratamiento
          </div>
          <button
            v-if="!editandoConclusion"
            class="btn btn-secondary btn-sm"
            style="background: white; border-color: #86efac; color: #166534"
            @click="iniciarEdicionConclusion"
          >
            ✏️ {{ cita.conclusion ? 'Editar Conclusión' : 'Registrar Conclusión' }}
          </button>
        </div>

        <div v-if="editandoConclusion">
          <textarea
            v-model="conclusionTexto"
            class="input"
            rows="4"
            placeholder="Escriba la conclusión clínica, diagnóstico definitivo, indicaciones terapéuticas o receta médica..."
            style="background: white; margin-bottom: 0.75rem; resize: vertical"
          ></textarea>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem">
            <button class="btn btn-secondary btn-sm" @click="editandoConclusion = false">
              Cancelar
            </button>
            <button
              class="btn btn-primary btn-sm"
              style="background: #16a34a; border: none"
              :disabled="guardandoConclusion"
              @click="guardarConclusionDirecta"
            >
              {{ guardandoConclusion ? 'Guardando...' : '💾 Guardar Conclusión Médica' }}
            </button>
          </div>
        </div>

        <div v-else>
          <p
            v-if="cita.conclusion"
            style="font-size: 0.975rem; line-height: 1.6; color: #14532d; white-space: pre-wrap; font-weight: 500"
          >
            {{ cita.conclusion }}
          </p>
          <p v-else style="color: #65a30d; font-size: 0.9rem; font-style: italic">
            Sin conclusión registrada aún. El especialista puede registrar el diagnóstico y tratamiento haciendo clic en "Registrar Conclusión".
          </p>
        </div>
      </div>

      <!-- Obs 3: Historial de Revisiones / Controles del Paciente -->
      <div v-if="otrasCitasPaciente.length > 0" style="margin-top: 1.5rem; padding: 1.35rem; background: var(--surface-hover); border-radius: var(--radius); border: 1px solid var(--border)">
        <div style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem">
          <span>🔄</span> Historial de Revisiones y Controles de {{ cita.paciente }} ({{ otrasCitasPaciente.length }})
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem">
          <div
            v-for="c in otrasCitasPaciente"
            :key="c.id"
            style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 0.65rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border); flex-wrap: wrap; gap: 0.5rem"
          >
            <div>
              <strong>📅 {{ formatearFecha(c.fecha) }} • ⏰ {{ c.hora }}</strong>
              <span style="margin-left: 0.5rem; color: var(--text-muted); font-size: 0.85rem">{{ c.motivo }}</span>
              <span v-if="c.conclusion" style="display: block; font-size: 0.75rem; color: #16a34a">
                ✅ Conclusión: {{ c.conclusion }}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem">
              <span class="badge" :class="getBadgeClase(c.estado)">{{ c.estado }}</span>
              <RouterLink :to="`/citas/${c.id}`" class="btn btn-ghost btn-sm" title="Ver cita">
                👁️
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Editar Cita General -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">✏️ Editar Cita Médica</h2>
          <button class="modal-close" @click="cerrarModal">✕</button>
        </div>

        <div v-if="errorModal" class="alert alert-error">
          <span>⚠️</span> {{ errorModal }}
        </div>

        <div class="form-group">
          <label class="form-label">Nombre del Paciente *</label>
          <input v-model="form.paciente" class="input" />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Médico Especialista (Derivación) *</label>
            <select v-model="form.medicoId" class="input">
              <option v-for="med in medicos" :key="med.id" :value="med.id">
                {{ med.nombre }} ({{ med.especialidad }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Estado</label>
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
            <label class="form-label">Fecha *</label>
            <input v-model="form.fecha" type="date" class="input" />
          </div>

          <div class="form-group">
            <label class="form-label">Hora *</label>
            <input v-model="form.hora" type="time" class="input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Costo (Bs.) *</label>
          <input v-model.number="form.costo" type="number" class="input" />
        </div>

        <div class="form-group">
          <label class="form-label">Motivo de Consulta *</label>
          <textarea v-model="form.motivo" class="input" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">📝 Conclusión Médica / Diagnóstico</label>
          <textarea
            v-model="form.conclusion"
            class="input"
            rows="3"
            placeholder="Diagnóstico clínico, indicaciones o prescripción..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="guardarEdicion">
            {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Programar Revisión Periódica (Obs 3) -->
    <div v-if="modalRevisionVisible" class="modal-overlay" @click.self="modalRevisionVisible = false">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">🔄 Programar Revisión Periódica / Control</h2>
          <button class="modal-close" @click="modalRevisionVisible = false">✕</button>
        </div>

        <div
          style="background: #ede9fe; border: 1px solid #ddd6fe; padding: 0.85rem 1rem; border-radius: var(--radius); margin-bottom: 1rem; font-size: 0.85rem; color: #5b21b6"
        >
          <strong>Paciente:</strong> {{ cita.paciente }} • <strong>Especialista:</strong> {{ medico?.nombre }}
          <div style="margin-top: 0.5rem; display: flex; gap: 0.4rem; flex-wrap: wrap">
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

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Fecha de Revisión *</label>
            <input v-model="formRevision.fecha" type="date" class="input" />
          </div>

          <div class="form-group">
            <label class="form-label">Hora *</label>
            <input v-model="formRevision.hora" type="time" class="input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Costo Preferencial de Control (Bs.) *</label>
          <input v-model.number="formRevision.costo" type="number" min="0" class="input" />
        </div>

        <div class="form-group">
          <label class="form-label">Motivo o Plan de Revisión *</label>
          <textarea
            v-model="formRevision.motivo"
            class="input"
            rows="3"
            placeholder="Ej: Evaluación de respuesta a tratamiento y control de signos..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="modalRevisionVisible = false">Cancelar</button>
          <button
            class="btn btn-primary"
            :disabled="guardandoRevision"
            @click="guardarRevisionPeriodica"
          >
            {{ guardandoRevision ? 'Agendando...' : '🔄 Confirmar y Agendar Revisión' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      :visible="confirmModalVisible"
      title="¿Eliminar esta Cita Médica?"
      :message="`¿Estás seguro de que deseas eliminar permanentemente la cita de ${cita?.paciente}?`"
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../lib/axios'
import ConfirmModal from '../components/ConfirmModal.vue'
import { calcularFechaRevision } from '../lib/validation'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const cita = ref(null)
const todasLasCitas = ref([])
const medicos = ref([])
const cargando = ref(true)

// Modal Edición General
const modalVisible = ref(false)
const guardando = ref(false)
const confirmModalVisible = ref(false)
const errorModal = ref('')
const form = ref({})

// Obs 2: Gestión de Conclusión Médica
const editandoConclusion = ref(false)
const conclusionTexto = ref('')
const guardandoConclusion = ref(false)

// Obs 3: Programación de Revisiones Periódicas
const modalRevisionVisible = ref(false)
const guardandoRevision = ref(false)
const formRevision = ref({
  fecha: '',
  hora: '10:00',
  costo: 120,
  motivo: ''
})

const medico = computed(() => {
  return medicos.value.find((m) => m.id == cita.value?.medicoId) || null
})

// Historial de otras citas/controles del mismo paciente
const otrasCitasPaciente = computed(() => {
  if (!cita.value || !todasLasCitas.value.length) return []
  return todasLasCitas.value
    .filter((c) => c.id != cita.value.id && c.paciente.trim().toLowerCase() === cita.value.paciente.trim().toLowerCase())
    .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
})

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

function imprimirFicha() {
  window.print()
}

async function cargarDetalle() {
  cargando.value = true
  try {
    const [resCita, resMedicos, resTodas] = await Promise.all([
      api.get(`/citas/${route.params.id}`),
      api.get('/medicos'),
      api.get('/citas')
    ])
    cita.value = resCita.data
    medicos.value = resMedicos.data
    todasLasCitas.value = resTodas.data
    conclusionTexto.value = cita.value.conclusion || ''

    // ── QA Guard: Privacidad de Citas entre Médicos ──
    if (!auth.isAdminOrRecepcion && cita.value) {
      const myDoctor =
        medicos.value.find((m) => m.id == auth.currentMedicoId) ||
        medicos.value.find((m) => m.email?.toLowerCase() === auth.user?.email?.toLowerCase()) ||
        medicos.value.find((m) => m.nombre?.toLowerCase().includes(auth.user?.name?.toLowerCase()))

      if (myDoctor && cita.value.medicoId && cita.value.medicoId !== myDoctor.id) {
        toast.warning('Acceso denegado: Esta cita médica pertenece a otro especialista.')
        router.push('/citas')
        return
      }
    }
  } catch (err) {
    console.error('Error al cargar detalle:', err)
    cita.value = null
  } finally {
    cargando.value = false
  }
}

// ── Obs 2: Guardado de Conclusión Médica ───────
function iniciarEdicionConclusion() {
  conclusionTexto.value = cita.value.conclusion || ''
  editandoConclusion.value = true
}

async function guardarConclusionDirecta() {
  if (!conclusionTexto.value.trim()) {
    toast.warning('Por favor escriba la conclusión médica antes de guardar.')
    return
  }

  guardandoConclusion.value = true
  try {
    const payload = {
      ...cita.value,
      conclusion: conclusionTexto.value.trim(),
      estado: cita.value.estado === 'Pendiente' ? 'Atendida' : cita.value.estado
    }
    await api.put(`/citas/${cita.value.id}`, payload)
    cita.value.conclusion = conclusionTexto.value.trim()
    cita.value.estado = payload.estado
    editandoConclusion.value = false
    toast.success('Conclusión médica y diagnóstico registrados con éxito.')
    await cargarDetalle()
  } catch {
    toast.error('Error al guardar la conclusión médica.')
  } finally {
    guardandoConclusion.value = false
  }
}

// ── Obs 3: Programar Revisión Periódica ───────
function abrirModalRevision() {
  const fechaSugerida = calcularFechaRevision(cita.value?.fecha || new Date().toISOString().slice(0, 10), 15)
  formRevision.value = {
    fecha: fechaSugerida,
    hora: cita.value?.hora || '10:00',
    costo: Math.round((Number(cita.value?.costo) || 150) * 0.8),
    motivo: `Revisión periódica y control de evolución de consulta #${cita.value?.id}`
  }
  modalRevisionVisible.value = true
}

function fijarFechaRevision(dias) {
  formRevision.value.fecha = calcularFechaRevision(cita.value?.fecha || new Date().toISOString().slice(0, 10), dias)
  toast.info(`Fecha de revisión ajustada a +${dias} días (${formatearFecha(formRevision.value.fecha)})`)
}

async function guardarRevisionPeriodica() {
  if (!formRevision.value.fecha || !formRevision.value.hora) {
    toast.warning('La fecha y hora de la revisión son obligatorias.')
    return
  }
  if (!formRevision.value.motivo.trim()) {
    toast.warning('El motivo o plan de control es obligatorio.')
    return
  }

  guardandoRevision.value = true
  try {
    const payload = {
      paciente: cita.value.paciente,
      medicoId: Number(cita.value.medicoId),
      fecha: formRevision.value.fecha,
      hora: formRevision.value.hora,
      motivo: formRevision.value.motivo.trim(),
      estado: 'Pendiente',
      costo: Number(formRevision.value.costo) || 0,
      esRevision: true,
      citaPadreId: cita.value.id,
      conclusion: ''
    }

    await api.post('/citas', payload)
    toast.success(`Revisión periódica agendada para el ${formatearFecha(payload.fecha)}`)
    modalRevisionVisible.value = false
    await cargarDetalle()
  } catch {
    toast.error('Error al programar la revisión periódica.')
  } finally {
    guardandoRevision.value = false
  }
}

// ── Cambio de Estado ─────────────────────────
async function cambiarEstado(nuevoEstado) {
  try {
    const payload = { ...cita.value, estado: nuevoEstado }
    await api.put(`/citas/${cita.value.id}`, payload)
    cita.value.estado = nuevoEstado
    toast.success(`Cita médica marcada como "${nuevoEstado}"`)
    if (nuevoEstado === 'Atendida' && !cita.value.conclusion) {
      toast.info('💡 Puedes registrar la conclusión de la consulta médica abajo.')
      iniciarEdicionConclusion()
    }
  } catch {
    toast.error('Error al cambiar el estado de la cita')
  }
}

function abrirModal() {
  form.value = { ...cita.value }
  errorModal.value = ''
  modalVisible.value = true
}

function cerrarModal() {
  modalVisible.value = false
}

async function guardarEdicion() {
  if (!form.value.paciente?.trim()) {
    errorModal.value = 'El nombre del paciente es obligatorio.'
    return
  }
  if (!form.value.motivo?.trim()) {
    errorModal.value = 'El motivo de consulta es obligatorio.'
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
      conclusion: form.value.conclusion ? form.value.conclusion.trim() : null,
      esRevision: form.value.esRevision || false,
      citaPadreId: form.value.citaPadreId || null
    }

    await api.put(`/citas/${cita.value.id}`, payload)
    toast.success('Cita médica actualizada correctamente')
    await cargarDetalle()
    cerrarModal()
  } catch {
    errorModal.value = 'Error al actualizar la cita médica.'
  } finally {
    guardando.value = false
  }
}

async function ejecutarEliminacion() {
  confirmModalVisible.value = false
  try {
    await api.delete(`/citas/${cita.value.id}`)
    toast.success('Cita médica eliminada')
    router.push('/citas')
  } catch {
    toast.error('Error al eliminar la cita')
  }
}

onMounted(cargarDetalle)
</script>
