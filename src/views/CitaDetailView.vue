<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem">
      <RouterLink to="/citas" class="btn btn-secondary btn-sm">
        ← Volver al listado de citas
      </RouterLink>
      <button class="btn btn-secondary btn-sm" @click="imprimirFicha" title="Imprimir comprobante médico">
        🖨️ Imprimir Ficha de Cita
      </button>
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
          <div style="display: flex; align-items: center; gap: 0.75rem">
            <h1 style="font-size: 1.7rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em">
              {{ cita.paciente }}
            </h1>
            <span class="badge" :class="getBadgeClase(cita.estado)">
              {{ cita.estado }}
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
          ✅ Marcar Atendida
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
            👨‍⚕️ Médico Especialista
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

      <!-- Motivo o Diagnóstico -->
      <div style="margin-top: 1.5rem; padding: 1.35rem; background: var(--surface-hover); border-radius: var(--radius); border: 1px solid var(--border)">
        <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem">
          📋 Motivo de Consulta y Síntomas Reportados
        </div>
        <p style="font-size: 0.975rem; line-height: 1.6; color: var(--text-main); white-space: pre-wrap">
          {{ cita.motivo || 'No se registraron observaciones adicionales.' }}
        </p>
      </div>
    </div>

    <!-- Modal Editar Cita -->
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
            <label class="form-label">Médico Especialista *</label>
            <select v-model="form.medicoId" class="input" :disabled="!auth.isAdmin">
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

        <div class="form-actions">
          <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="guardarEdicion">
            {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
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

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const cita = ref(null)
const medicos = ref([])
const cargando = ref(true)
const modalVisible = ref(false)
const guardando = ref(false)
const confirmModalVisible = ref(false)
const errorModal = ref('')
const form = ref({})

const medico = computed(() => {
  return medicos.value.find((m) => m.id == cita.value?.medicoId) || null
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
    const [resCita, resMedicos] = await Promise.all([
      api.get(`/citas/${route.params.id}`),
      api.get('/medicos')
    ])
    cita.value = resCita.data
    medicos.value = resMedicos.data

    // ── QA Guard: Privacidad de Citas entre Médicos ──
    if (!auth.isAdmin && cita.value) {
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

async function cambiarEstado(nuevoEstado) {
  try {
    const payload = { ...cita.value, estado: nuevoEstado }
    await api.put(`/citas/${cita.value.id}`, payload)
    cita.value.estado = nuevoEstado
    toast.success(`Cita médica marcada como "${nuevoEstado}"`)
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
      costo: Number(form.value.costo) || 0
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
