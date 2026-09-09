import { describe, it, expect } from 'vitest'
import {
  evaluarTransicionEstado,
  detectarConflictoHorario,
  esFechaEnElPasado,
  esEmailValido,
  ESTADOS_VALIDOS
} from '../src/lib/validation'

describe('🧪 QA Suite: Máquina de Estados y Transiciones de Citas', () => {
  it('debe permitir transiciones normales de Pendiente a Confirmada y Atendida sin alertas críticas', () => {
    const res1 = evaluarTransicionEstado('Pendiente', 'Confirmada')
    expect(res1.permitido).toBe(true)
    expect(res1.esCritica).toBe(false)

    const res2 = evaluarTransicionEstado('Confirmada', 'Atendida')
    expect(res2.permitido).toBe(true)
    expect(res2.esCritica).toBe(false)
  })

  it('debe marcar como CRÍTICA la transición si se intenta revertir de Atendida a Pendiente o Cancelada', () => {
    const resRevertir = evaluarTransicionEstado('Atendida', 'Pendiente')
    expect(resRevertir.permitido).toBe(true)
    expect(resRevertir.esCritica).toBe(true)
    expect(resRevertir.advertencia).toContain('ya fue marcada como "Atendida"')

    const resCancelar = evaluarTransicionEstado('Atendida', 'Cancelada')
    expect(resCancelar.permitido).toBe(true)
    expect(resCancelar.esCritica).toBe(true)
  })

  it('debe marcar como CRÍTICA la reactivación de una cita Cancelada', () => {
    const resReactivar = evaluarTransicionEstado('Cancelada', 'Pendiente')
    expect(resReactivar.permitido).toBe(true)
    expect(resReactivar.esCritica).toBe(true)
    expect(resReactivar.advertencia).toContain('fue cancelada previamente')
  })

  it('debe rechazar estados no existentes en la lista oficial', () => {
    const resInvalido = evaluarTransicionEstado('Pendiente', 'EstadoFantasma')
    expect(resInvalido.permitido).toBe(false)
  })
})

describe('🧪 QA Suite: Prevención de Conflictos de Horario (Double Booking)', () => {
  const listaCitasEjemplo = [
    { id: 1, paciente: 'Ana', medicoId: 1, fecha: '2026-09-15', hora: '10:00', estado: 'Confirmada' },
    { id: 2, paciente: 'Pedro', medicoId: 1, fecha: '2026-09-15', hora: '11:00', estado: 'Cancelada' },
    { id: 3, paciente: 'Luis', medicoId: 2, fecha: '2026-09-15', hora: '10:00', estado: 'Pendiente' }
  ]

  it('debe detectar colisión de horario si se agenda al mismo médico en la misma fecha y hora', () => {
    const nuevaCitaConConflicto = {
      id: null,
      paciente: 'Carlos',
      medicoId: 1,
      fecha: '2026-09-15',
      hora: '10:00'
    }

    const res = detectarConflictoHorario(nuevaCitaConConflicto, listaCitasEjemplo)
    expect(res.tieneConflicto).toBe(true)
    expect(res.citaConflicto?.paciente).toBe('Ana')
  })

  it('NO debe generar conflicto si la cita existente en ese horario está Cancelada', () => {
    const nuevaCitaEnHorarioCancelado = {
      id: null,
      paciente: 'Carlos',
      medicoId: 1,
      fecha: '2026-09-15',
      hora: '11:00'
    }

    const res = detectarConflictoHorario(nuevaCitaEnHorarioCancelado, listaCitasEjemplo)
    expect(res.tieneConflicto).toBe(false)
  })

  it('NO debe generar conflicto si es un médico diferente a la misma hora', () => {
    const nuevaCitaOtroMedico = {
      id: null,
      paciente: 'Carlos',
      medicoId: 3, // Médico 3 está libre
      fecha: '2026-09-15',
      hora: '10:00'
    }

    const res = detectarConflictoHorario(nuevaCitaOtroMedico, listaCitasEjemplo)
    expect(res.tieneConflicto).toBe(false)
  })

  it('NO debe considerarse conflicto consigo misma al editar una cita', () => {
    const citaEditando = {
      id: 1,
      paciente: 'Ana Modificada',
      medicoId: 1,
      fecha: '2026-09-15',
      hora: '10:00'
    }

    const res = detectarConflictoHorario(citaEditando, listaCitasEjemplo)
    expect(res.tieneConflicto).toBe(false)
  })
})

describe('🧪 QA Suite: Validaciones de Fechas y Correos', () => {
  it('debe validar correos electrónicos válidos e inválidos', () => {
    expect(esEmailValido('admin@saludplus.com')).toBe(true)
    expect(esEmailValido('noemi.vera@clinica.edu.bo')).toBe(true)
    expect(esEmailValido('correo_invalido')).toBe(false)
    expect(esEmailValido('sin_arroba.com')).toBe(false)
    expect(esEmailValido('')).toBe(false)
  })

  it('debe identificar fechas en el pasado', () => {
    expect(esFechaEnElPasado('2020-01-01')).toBe(true)
    expect(esFechaEnElPasado('2099-12-31')).toBe(false)
  })
})
