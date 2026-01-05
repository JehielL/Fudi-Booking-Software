import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  RestaurantSchedule, 
  ScheduleCreate, 
  ClosedDate, 
  ClosedDateCreate,
  DayOfWeek 
} from '../Interfaces/schedule.model';

/**
 * Servicio para gestionar los horarios y fechas cerradas de un restaurante.
 * Estos endpoints requieren autenticación (dueño del restaurante).
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly baseUrl = 'http://localhost:8080/api/restaurants';

  constructor(private http: HttpClient) {}

  // ============================================
  // GESTIÓN DE HORARIOS SEMANALES
  // ============================================

  /**
   * Obtiene todos los horarios configurados del restaurante.
   * Retorna un array de hasta 7 horarios (uno por día de la semana).
   * 
   * @param restaurantId ID del restaurante
   * @returns Array de RestaurantSchedule
   */
  getSchedules(restaurantId: number): Observable<RestaurantSchedule[]> {
    return this.http.get<RestaurantSchedule[]>(
      `${this.baseUrl}/${restaurantId}/schedules`
    );
  }

  /**
   * Crea un nuevo horario para un día de la semana.
   * Si ya existe un horario para ese día, el backend lo actualiza.
   * 
   * @param restaurantId ID del restaurante
   * @param schedule Datos del horario a crear
   * @returns El horario creado
   */
  createSchedule(restaurantId: number, schedule: ScheduleCreate): Observable<RestaurantSchedule> {
    return this.http.post<RestaurantSchedule>(
      `${this.baseUrl}/${restaurantId}/schedules`,
      schedule
    );
  }

  /**
   * Actualiza un horario existente.
   * Solo envía los campos que se quieren modificar.
   * 
   * @param restaurantId ID del restaurante
   * @param dayOfWeek Día de la semana (MONDAY, TUESDAY, etc.)
   * @param schedule Datos parciales a actualizar
   * @returns El horario actualizado
   */
  updateSchedule(
    restaurantId: number, 
    dayOfWeek: DayOfWeek, 
    schedule: Partial<ScheduleCreate>
  ): Observable<RestaurantSchedule> {
    return this.http.put<RestaurantSchedule>(
      `${this.baseUrl}/${restaurantId}/schedules/${dayOfWeek}`,
      schedule
    );
  }

  /**
   * Elimina el horario de un día específico.
   * El restaurante quedará como "sin horario definido" para ese día.
   * 
   * @param restaurantId ID del restaurante
   * @param dayOfWeek Día de la semana
   */
  deleteSchedule(restaurantId: number, dayOfWeek: DayOfWeek): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${restaurantId}/schedules/${dayOfWeek}`
    );
  }

  /**
   * Actualiza todos los horarios de la semana de una vez.
   * Útil para guardar cambios masivos usando el endpoint bulk.
   * 
   * @param restaurantId ID del restaurante
   * @param schedules Array de horarios a crear/actualizar
   * @returns Observable con todos los horarios actualizados
   */
  saveAllSchedules(restaurantId: number, schedules: ScheduleCreate[]): Observable<RestaurantSchedule[]> {
    return this.http.put<RestaurantSchedule[]>(
      `${this.baseUrl}/${restaurantId}/schedules/bulk`,
      schedules
    );
  }

  // ============================================
  // GESTIÓN DE FECHAS CERRADAS
  // ============================================

  /**
   * Obtiene todas las fechas cerradas del restaurante.
   * Incluye fechas puntuales y recurrentes anuales.
   * 
   * @param restaurantId ID del restaurante
   * @returns Array de ClosedDate
   */
  getClosedDates(restaurantId: number): Observable<ClosedDate[]> {
    return this.http.get<ClosedDate[]>(
      `${this.baseUrl}/${restaurantId}/closed-dates`
    );
  }

  /**
   * Agrega una nueva fecha cerrada.
   * 
   * @param restaurantId ID del restaurante
   * @param closedDate Datos de la fecha cerrada
   * @returns La fecha cerrada creada
   */
  addClosedDate(restaurantId: number, closedDate: ClosedDateCreate): Observable<ClosedDate> {
    return this.http.post<ClosedDate>(
      `${this.baseUrl}/${restaurantId}/closed-dates`,
      closedDate
    );
  }

  /**
   * Elimina una fecha cerrada.
   * 
   * @param restaurantId ID del restaurante
   * @param closedDateId ID de la fecha cerrada a eliminar
   */
  removeClosedDate(restaurantId: number, closedDateId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${restaurantId}/closed-dates/${closedDateId}`
    );
  }

  /**
   * Verifica si una fecha específica está cerrada.
   * 
   * @param closedDates Lista de fechas cerradas
   * @param date Fecha a verificar (YYYY-MM-DD)
   * @returns La fecha cerrada si existe, o undefined
   */
  isDateClosed(closedDates: ClosedDate[], date: string): ClosedDate | undefined {
    const targetDate = new Date(date);
    
    return closedDates.find(cd => {
      const closedDate = new Date(cd.closedDate);
      
      // Verificar fecha exacta
      if (cd.closedDate === date) {
        return true;
      }
      
      // Verificar si es recurrente anual (mismo día y mes)
      if (cd.isRecurringYearly) {
        return closedDate.getMonth() === targetDate.getMonth() && 
               closedDate.getDate() === targetDate.getDate();
      }
      
      return false;
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtiene el horario de un día específico.
   * 
   * @param schedules Lista de horarios
   * @param dayOfWeek Día de la semana
   * @returns El horario del día o undefined
   */
  getScheduleForDay(schedules: RestaurantSchedule[], dayOfWeek: DayOfWeek): RestaurantSchedule | undefined {
    return schedules.find(s => s.dayOfWeek === dayOfWeek);
  }

  /**
   * Verifica si el restaurante tiene horarios configurados.
   * 
   * @param schedules Lista de horarios
   * @returns true si tiene al menos un día configurado como abierto
   */
  hasSchedulesConfigured(schedules: RestaurantSchedule[]): boolean {
    return schedules.some(s => s.isOpen);
  }

  /**
   * Obtiene los días que el restaurante está abierto.
   * 
   * @param schedules Lista de horarios
   * @returns Array de días abiertos
   */
  getOpenDays(schedules: RestaurantSchedule[]): DayOfWeek[] {
    return schedules.filter(s => s.isOpen).map(s => s.dayOfWeek);
  }
}
