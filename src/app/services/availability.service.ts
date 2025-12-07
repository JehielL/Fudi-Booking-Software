import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AvailabilityResponse } from '../Interfaces/schedule.model';

/**
 * Servicio para consultar la disponibilidad de un restaurante.
 * Estos endpoints son públicos (no requieren autenticación).
 */
@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private readonly baseUrl = 'http://localhost:8080/api/restaurants';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la disponibilidad de un restaurante para un día específico.
   * Retorna los slots de tiempo con su capacidad disponible.
   * 
   * @param restaurantId ID del restaurante
   * @param date Fecha en formato YYYY-MM-DD
   * @returns Información de disponibilidad con slots
   */
  getAvailability(restaurantId: number, date: string): Observable<AvailabilityResponse> {
    const params = new HttpParams().set('date', date);
    return this.http.get<AvailabilityResponse>(
      `${this.baseUrl}/${restaurantId}/availability`,
      { params }
    );
  }

  /**
   * Obtiene la disponibilidad de un restaurante para una semana completa.
   * Útil para mostrar un calendario semanal.
   * 
   * @param restaurantId ID del restaurante
   * @param startDate Fecha de inicio en formato YYYY-MM-DD
   * @returns Array de 7 AvailabilityResponse (uno por día)
   */
  getWeekAvailability(restaurantId: number, startDate: string): Observable<AvailabilityResponse[]> {
    const params = new HttpParams().set('startDate', startDate);
    return this.http.get<AvailabilityResponse[]>(
      `${this.baseUrl}/${restaurantId}/availability/week`,
      { params }
    );
  }

  /**
   * Verifica si hay capacidad disponible para un número específico de personas
   * en un slot determinado.
   * 
   * @param slot El slot a verificar
   * @param numPeople Número de personas para la reserva
   * @returns true si hay capacidad suficiente
   */
  hasCapacity(slot: { available: boolean; remainingCapacity: number }, numPeople: number): boolean {
    return slot.available && slot.remainingCapacity >= numPeople;
  }

  /**
   * Filtra los slots disponibles para un número de personas.
   * 
   * @param availability Respuesta de disponibilidad
   * @param numPeople Número de personas
   * @returns Solo los slots que tienen capacidad suficiente
   */
  filterAvailableSlots(availability: AvailabilityResponse, numPeople: number): AvailabilityResponse {
    return {
      ...availability,
      slots: availability.slots.filter(slot => this.hasCapacity(slot, numPeople))
    };
  }

  /**
   * Obtiene el próximo día disponible a partir de una fecha.
   * Útil cuando el día seleccionado está cerrado.
   * 
   * @param weekAvailability Array de disponibilidad semanal
   * @returns La primera fecha abierta o null si toda la semana está cerrada
   */
  getNextOpenDay(weekAvailability: AvailabilityResponse[]): AvailabilityResponse | null {
    return weekAvailability.find(day => day.isOpen && day.slots.some(s => s.available)) || null;
  }
}
