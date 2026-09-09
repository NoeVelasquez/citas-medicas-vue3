/**
 * Módulo de Reglas de Negocio, Validaciones Críticas y Máquina de Estados
 * para Gestión de Citas Médicas (SaludPlus QA Suite)
 */

export const ESTADOS_VALIDOS = ['Pendiente', 'Confirmada', 'Atendida', 'Cancelada']

/**
 * Evalúa si una transición de estado es válida o requiere confirmación crítica
 * @param {string} estadoActual 
 * @param {string} nuevoEstado 
 * @returns {{ permitido: boolean, esCritica: boolean, advertencia: string|null }}
 */
export function evaluarTransicionEstado(estadoActual, nuevoEstado) {
  if (estadoActual === nuevoEstado) {
    return { permitido: true, esCritica: false, advertencia: null }
  }

  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    return { permitido: false, esCritica: false, advertencia: 'Estado no reconocido en el sistema.' }
  }

  // Caso Crítico 1: Revertir una consulta ya Atendida
  if (estadoActual === 'Atendida' && (nuevoEstado === 'Pendiente' || nuevoEstado === 'Cancelada')) {
    return {
      permitido: true,
      esCritica: true,
      advertencia: `⚠️ ADVERTENCIA CLÍNICA: Esta cita ya fue marcada como "Atendida" (consulta finalizada y honorarios calculados). ¿Estás seguro de que deseas cambiarla a "${nuevoEstado}"?`
    }
  }

  // Caso Crítico 2: Reactivar una cita Cancelada
  if (estadoActual === 'Cancelada' && nuevoEstado !== 'Cancelada') {
    return {
      permitido: true,
      esCritica: true,
      advertencia: `⚠️ Esta cita médica fue cancelada previamente. ¿Deseas reactivarla en estado "${nuevoEstado}"?`
    }
  }

  return { permitido: true, esCritica: false, advertencia: null }
}

/**
 * Detecta si existe colisión de horario para el mismo médico
 * @param {Object} citaForm - Datos de la cita a guardar (medicoId, fecha, hora, id opcional)
 * @param {Array} listaCitas - Todas las citas registradas
 * @returns {{ tieneConflicto: boolean, citaConflicto: Object|null }}
 */
export function detectarConflictoHorario(citaForm, listaCitas = []) {
  if (!citaForm.medicoId || !citaForm.fecha || !citaForm.hora) {
    return { tieneConflicto: false, citaConflicto: null }
  }

  const conflicto = listaCitas.find((c) => {
    // Ignorar la misma cita si se está editando
    if (citaForm.id && c.id == citaForm.id) return false

    // Ignorar citas canceladas
    if (c.estado === 'Cancelada') return false

    // Mismo médico, misma fecha y misma hora
    return (
      c.medicoId == citaForm.medicoId &&
      c.fecha === citaForm.fecha &&
      c.hora === citaForm.hora
    )
  })

  return {
    tieneConflicto: !!conflicto,
    citaConflicto: conflicto || null
  }
}

/**
 * Valida si una fecha es anterior a hoy
 * @param {string} fechaStr - YYYY-MM-DD
 * @returns {boolean}
 */
export function esFechaEnElPasado(fechaStr) {
  if (!fechaStr) return false
  const hoyStr = new Date().toISOString().slice(0, 10)
  return fechaStr < hoyStr
}

/**
 * Valida formato de correo electrónico
 * @param {string} email 
 * @returns {boolean}
 */
export function esEmailValido(email) {
  if (!email) return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email.trim())
}
