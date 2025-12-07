import { Restaurant } from './restaurant.model';

// ============================================
// TIPOS DE DÍAS DE LA SEMANA
// ============================================

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo'
};

export const DAY_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mié',
  THURSDAY: 'Jue',
  FRIDAY: 'Vie',
  SATURDAY: 'Sáb',
  SUNDAY: 'Dom'
};

// ============================================
// MODELO DE HORARIO DEL RESTAURANTE
// ============================================

export interface RestaurantSchedule {
  id?: number;
  restaurant?: Restaurant;
  dayOfWeek: DayOfWeek;
  isOpen: boolean;
  openTime: string;              // "09:00:00"
  closeTime: string;             // "23:00:00"
  
  // Horarios específicos (opcionales)
  lunchStartTime?: string;       // "12:00:00"
  lunchEndTime?: string;         // "16:00:00"
  dinnerStartTime?: string;      // "19:00:00"
  dinnerEndTime?: string;        // "23:00:00"
  
  // Capacidad
  maxCapacity: number;           // Aforo total del restaurante
  maxCapacityPerSlot: number;    // Máximo personas por slot (ej: 20)
  slotIntervalMinutes: number;   // Duración del slot (default: 30)
}

// Para crear/actualizar horarios
export interface ScheduleCreate {
  dayOfWeek: DayOfWeek;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  dinnerStartTime?: string;
  dinnerEndTime?: string;
  maxCapacity?: number;
  maxCapacityPerSlot?: number;
  slotIntervalMinutes?: number;
}

// Valores por defecto para un nuevo horario
export const DEFAULT_SCHEDULE: Omit<RestaurantSchedule, 'dayOfWeek'> = {
  isOpen: true,
  openTime: '09:00:00',
  closeTime: '23:00:00',
  maxCapacity: 50,
  maxCapacityPerSlot: 20,
  slotIntervalMinutes: 30
};

// ============================================
// MODELO DE FECHAS CERRADAS
// ============================================

export interface ClosedDate {
  id?: number;
  restaurant?: Restaurant;
  closedDate: string;            // "2025-12-25"
  reason?: string;               // "Navidad"
  isRecurringYearly: boolean;    // Si se repite cada año
  createdAt?: string;
}

export interface ClosedDateCreate {
  closedDate: string;
  reason?: string;
  isRecurringYearly: boolean;
}

// ============================================
// MODELO DE DISPONIBILIDAD (SLOTS)
// ============================================

export interface TimeSlotDTO {
  time: string;                  // "19:00"
  available: boolean;
  remainingCapacity: number;     // Personas que aún caben
  maxCapacity: number;           // Capacidad total del slot
}

export interface AvailabilityResponse {
  restaurantId: number;
  date: string;                  // "2025-01-15"
  isOpen: boolean;
  closedReason?: string;         // Si está cerrado, el motivo
  slots: TimeSlotDTO[];
}

// ============================================
// HELPERS Y UTILIDADES
// ============================================

// Obtener el estado visual de un slot
export type SlotStatus = 'available' | 'limited' | 'full' | 'selected';

export function getSlotStatus(slot: TimeSlotDTO, numPeople: number = 1): SlotStatus {
  if (!slot.available || slot.remainingCapacity === 0) {
    return 'full';
  }
  if (slot.remainingCapacity < numPeople) {
    return 'full';
  }
  if (slot.remainingCapacity < slot.maxCapacity * 0.25) {
    return 'limited';
  }
  return 'available';
}

// Colores para estados de slots
export const SLOT_STATUS_CONFIG: Record<SlotStatus, { bgClass: string; textClass: string; label: string }> = {
  available: {
    bgClass: 'bg-success-subtle',
    textClass: 'text-success',
    label: 'Disponible'
  },
  limited: {
    bgClass: 'bg-warning-subtle',
    textClass: 'text-warning',
    label: 'Pocas plazas'
  },
  full: {
    bgClass: 'bg-danger-subtle',
    textClass: 'text-danger',
    label: 'Lleno'
  },
  selected: {
    bgClass: 'bg-primary',
    textClass: 'text-white',
    label: 'Seleccionado'
  }
};

// Formatear hora de "HH:mm:ss" a "HH:mm"
export function formatTime(time: string): string {
  if (!time) return '';
  return time.substring(0, 5);
}

// Convertir hora de "HH:mm" a "HH:mm:ss"
export function toFullTime(time: string): string {
  if (!time) return '';
  if (time.length === 5) return time + ':00';
  return time;
}

// ============================================
// MODELO DE ANALYTICS
// ============================================

export interface WeekdayCountDTO {
  weekday: DayOfWeek;
  count: number;
}

export interface WeekdayDistributionResponse {
  restaurantId: number;
  startDate: string;             // "YYYY-MM-DD"
  endDate: string;               // "YYYY-MM-DD"
  data: WeekdayCountDTO[];
}

// Datos procesados para visualización
export interface WeekdayChartData {
  weekday: DayOfWeek;
  label: string;                 // "Lunes", "Martes", etc.
  shortLabel: string;            // "Lun", "Mar", etc.
  count: number;
  percentage: number;            // Porcentaje del total
  isHighest: boolean;            // Si es el día con más reservas
}

// Rangos predefinidos para selector
export type DateRangePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export interface DateRangeOption {
  key: DateRangePreset;
  label: string;
  getRange: () => { startDate: string; endDate: string };
}

// Helper para obtener rangos de fecha
export function getDateRangePresets(): DateRangeOption[] {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  return [
    {
      key: 'last7days',
      label: 'Últimos 7 días',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    },
    {
      key: 'last30days',
      label: 'Últimos 30 días',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    },
    {
      key: 'thisMonth',
      label: 'Este mes',
      getRange: () => {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date();
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    },
    {
      key: 'lastMonth',
      label: 'Mes anterior',
      getRange: () => {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    },
    {
      key: 'thisYear',
      label: 'Este año',
      getRange: () => {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date();
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    },
    {
      key: 'custom',
      label: 'Personalizado',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    }
  ];
}

// Procesar datos de analytics para gráficos
export function processWeekdayData(data: WeekdayCountDTO[] | undefined | null): WeekdayChartData[] {
  // Validación defensiva: si no hay datos, devolver estructura vacía
  if (!data || !Array.isArray(data)) {
    console.warn('⚠️ processWeekdayData: datos no válidos, devolviendo estructura vacía', data);
    return DAYS_OF_WEEK.map(day => ({
      weekday: day,
      label: DAY_OF_WEEK_LABELS[day],
      shortLabel: DAY_OF_WEEK_SHORT[day],
      count: 0,
      percentage: 0,
      isHighest: false
    }));
  }

  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);
  const counts = data.map(d => d.count || 0);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
  
  // Asegurar que todos los días estén presentes
  return DAYS_OF_WEEK.map(day => {
    const found = data.find(d => d.weekday === day);
    const count = found?.count || 0;
    return {
      weekday: day,
      label: DAY_OF_WEEK_LABELS[day],
      shortLabel: DAY_OF_WEEK_SHORT[day],
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      isHighest: count === maxCount && count > 0
    };
  });
}
