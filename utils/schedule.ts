import { DateTime } from 'luxon'

/**
 * Parsea una cadena de días de la semana y devuelve un array de números ISO (1=Lunes, 7=Domingo)
 */
export function parseDaysOfWeek(str: string): number[] {
  if (!str) return []
  
  const map: Record<string, number> = {
    // Inglés
    mon: 1, monday: 1, m: 1,
    tue: 2, tuesday: 2, tu: 2, 
    wed: 3, wednesday: 3, w: 3,
    thu: 4, thursday: 4, th: 4,
    fri: 5, friday: 5, f: 5,
    sat: 6, saturday: 6, sa: 6,
    sun: 7, sunday: 7, su: 7,
    // Español
    lun: 1, lunes: 1,
    mar: 2, martes: 2,
    mie: 3, miercoles: 3, mié: 3, miércoles: 3,
    jue: 4, jueves: 4,
    vie: 5, viernes: 5,
    sab: 6, sabado: 6, sábado: 6,
    dom: 7, domingo: 7,
    // Números (algunos sistemas usan 0=Domingo, 7=Domingo)
    '0': 7, // Domingo
    '1': 1, // Lunes
    '2': 2, // Martes
    '3': 3, // Miércoles
    '4': 4, // Jueves
    '5': 5, // Viernes
    '6': 6, // Sábado
    '7': 7, // Domingo
  }
  
  return [...new Set(
    str.split(/[\s,;|/]+/)
      .map(t => t.trim().toLowerCase())
      .map(t => map[t])
      .filter(Boolean)
  )]
}

/**
 * Expande las ocurrencias de una sesión basándose en las fechas de inicio/fin y días de la semana
 */
export function expandOccurrences(
  session: {
    startdate: string
    enddate?: string | null
    starttime: string
    endtime: string
    daysofweek?: string | null
    cancel?: string | null
  }
): { start: Date; end: Date; ymd: string }[] {
  const zone = 'America/New_York'
  
  const startDate = DateTime.fromISO(session.startdate, { zone }).startOf('day')
  const endDate = session.enddate 
    ? DateTime.fromISO(session.enddate, { zone }).startOf('day')
    : startDate
    
  const daysOfWeek = parseDaysOfWeek(session.daysofweek || '')
  
  // Parsear fechas canceladas de la columna cancel
  const canceledDates = session.cancel 
    ? new Set(session.cancel.split(',').map(date => date.trim()))
    : new Set<string>()
  
  // Parsear las horas de inicio y fin
  const [startHour, startMinute] = (session.starttime || '00:00').split(':').map(n => parseInt(n, 10))
  const [endHour, endMinute] = (session.endtime || '00:00').split(':').map(n => parseInt(n, 10))
  
  const occurrences: { start: Date; end: Date; ymd: string }[] = []
  
  let currentDate = startDate
  while (currentDate <= endDate) {
    // Si no hay días específicos o si el día actual está en la lista
    const shouldInclude = daysOfWeek.length === 0 || daysOfWeek.includes(currentDate.weekday)
    
    // Verificar si esta fecha está cancelada
    const dateString = currentDate.toFormat('yyyy-LL-dd')
    const isCanceled = canceledDates.has(dateString)
    
    if (shouldInclude && !isCanceled) {
      const sessionStart = currentDate.set({ hour: startHour, minute: startMinute })
      const sessionEnd = currentDate.set({ hour: endHour, minute: endMinute })
      
      occurrences.push({
        start: sessionStart.toJSDate(),
        end: sessionEnd.toJSDate(),
        ymd: currentDate.toFormat('yyyyLLdd')
      })
    }
    
    currentDate = currentDate.plus({ days: 1 })
  }
  
  return occurrences
}

/**
 * Formatea los días de la semana para mostrar
 */
export function formatDaysOfWeek(daysStr: string): string {
  const days = parseDaysOfWeek(daysStr)
  const dayNames = {
    1: 'Lun',
    2: 'Mar', 
    3: 'Mié',
    4: 'Jue',
    5: 'Vie',
    6: 'Sáb',
    7: 'Dom'
  }
  
  return days.map(day => dayNames[day as keyof typeof dayNames]).join(', ')
}

/**
 * Valida que una cadena de días de la semana sea válida
 */
export function validateDaysOfWeek(daysStr: string): boolean {
  if (!daysStr.trim()) return false
  const parsed = parseDaysOfWeek(daysStr)
  return parsed.length > 0
}

/**
 * Convierte un array de números de días a una cadena
 */
export function daysArrayToString(days: number[]): string {
  const dayNames = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday', 
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday'
  }
  
  return days.map(day => dayNames[day as keyof typeof dayNames]).join(',')
}
