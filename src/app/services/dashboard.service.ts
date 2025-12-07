import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DashboardResponse, 
  DashboardQuickStats, 
  DashboardBooking, 
  DashboardMonthlyStats,
  DashboardTodayBooking
} from '../Interfaces/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = 'http://localhost:8080/dashboard';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los datos del dashboard para un restaurante
   */
  getRestaurantDashboard(restaurantId: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/restaurant/${restaurantId}`);
  }

  /**
   * Obtiene estadísticas rápidas del dashboard
   */
  getQuickStats(restaurantId: number): Observable<DashboardQuickStats> {
    return this.http.get<DashboardQuickStats>(`${this.baseUrl}/restaurant/${restaurantId}/quick`);
  }

  /**
   * Obtiene las reservas del restaurante en un rango de fechas
   * @param restaurantId ID del restaurante
   * @param start Fecha inicio (YYYY-MM-DD) - por defecto hoy
   * @param end Fecha fin (YYYY-MM-DD) - por defecto 30 días después
   */
  getBookings(restaurantId: number, start?: string, end?: string): Observable<DashboardBooking[]> {
    const today = new Date();
    const defaultStart = start || today.toISOString().split('T')[0];
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 30);
    const defaultEnd = end || futureDate.toISOString().split('T')[0];
    
    return this.http.get<DashboardBooking[]>(
      `${this.baseUrl}/restaurant/${restaurantId}/bookings?start=${defaultStart}&end=${defaultEnd}`
    );
  }

  /**
   * Obtiene las reservas pendientes del restaurante (próximos 30 días)
   */
  getPendingBookings(restaurantId: number): Observable<DashboardBooking[]> {
    return this.getBookings(restaurantId);
  }

  /**
   * Obtiene estadísticas mensuales del restaurante
   */
  getMonthlyStats(restaurantId: number): Observable<DashboardMonthlyStats[]> {
    return this.http.get<DashboardMonthlyStats[]>(`${this.baseUrl}/restaurant/${restaurantId}/monthly`);
  }

  /**
   * Obtiene las reservas de hoy del restaurante
   */
  getTodayBookings(restaurantId: number): Observable<DashboardTodayBooking[]> {
    return this.http.get<DashboardTodayBooking[]>(`${this.baseUrl}/restaurant/${restaurantId}/today`);
  }

  // =============== ACCIONES DE RESERVA ===============

  /**
   * Confirma una reserva pendiente
   */
  confirmBooking(bookingId: number): Observable<any> {
    return this.http.post(`http://localhost:8080/bookings/${bookingId}/confirm`, {});
  }

  /**
   * Rechaza una reserva pendiente
   */
  rejectBooking(bookingId: number, reason?: string): Observable<any> {
    return this.http.post(`http://localhost:8080/bookings/${bookingId}/reject`, { reason });
  }

  /**
   * Cancela una reserva
   */
  cancelBooking(bookingId: number, reason?: string): Observable<any> {
    return this.http.post(`http://localhost:8080/bookings/${bookingId}/cancel`, { reason });
  }

  /**
   * Marca una reserva como completada
   */
  completeBooking(bookingId: number): Observable<any> {
    return this.http.post(`http://localhost:8080/bookings/${bookingId}/complete`, {});
  }

  /**
   * Marca una reserva como no asistió
   */
  noShowBooking(bookingId: number): Observable<any> {
    return this.http.post(`http://localhost:8080/bookings/${bookingId}/no-show`, {});
  }
}
