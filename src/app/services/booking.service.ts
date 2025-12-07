import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../Interfaces/booking.model';
import { BookingStatus } from '../Interfaces/booking-status.model';

export interface BookingFilter {
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface BookingResponse {
  booking: Booking;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly baseUrl = 'http://localhost:8080/bookings';

  constructor(private http: HttpClient) {}

  // =============== CRUD BÁSICO ===============

  /**
   * Obtiene todas las reservas
   */
  getAll(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.baseUrl);
  }

  /**
   * Obtiene una reserva por ID
   */
  getById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea una nueva reserva
   */
  create(booking: Partial<Booking>): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, booking);
  }

  /**
   * Actualiza una reserva
   */
  update(id: number, booking: Partial<Booking>): Observable<Booking> {
    return this.http.put<Booking>(`${this.baseUrl}/${id}`, booking);
  }

  /**
   * Elimina una reserva
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // =============== FILTROS POR RESTAURANTE ===============

  /**
   * Obtiene reservas de un restaurante
   */
  getByRestaurant(restaurantId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/filter-by-restaurant/${restaurantId}`);
  }

  /**
   * Obtiene las reservas de hoy de un restaurante
   */
  getTodayByRestaurant(restaurantId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/restaurant/${restaurantId}/today`);
  }

  /**
   * Obtiene las reservas pendientes de un restaurante
   */
  getPendingByRestaurant(restaurantId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/restaurant/${restaurantId}/pending`);
  }

  /**
   * Obtiene las próximas reservas de un restaurante
   */
  getUpcomingByRestaurant(restaurantId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/restaurant/${restaurantId}/upcoming`);
  }

  /**
   * Obtiene reservas de un restaurante filtradas por estado
   */
  getByRestaurantAndStatus(restaurantId: number, status: BookingStatus): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/restaurant/${restaurantId}/status/${status}`);
  }

  // =============== MIS RESERVAS (USUARIO) ===============

  /**
   * Obtiene todas las reservas del usuario autenticado
   */
  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/my-bookings`);
  }

  /**
   * Obtiene las próximas reservas del usuario autenticado
   */
  getMyUpcomingBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/my-bookings/upcoming`);
  }

  /**
   * Obtiene el historial de reservas del usuario autenticado
   */
  getMyBookingsHistory(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/my-bookings/history`);
  }

  // =============== GESTIÓN DE ESTADOS ===============

  /**
   * Confirma una reserva pendiente
   */
  confirm(bookingId: number): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${bookingId}/confirm`, {});
  }

  /**
   * Rechaza una reserva pendiente
   */
  reject(bookingId: number, reason?: string): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${bookingId}/reject`, { reason });
  }

  /**
   * Cancela una reserva (por usuario o restaurante)
   */
  cancel(bookingId: number, reason?: string): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${bookingId}/cancel`, { reason });
  }

  /**
   * Marca una reserva como completada
   */
  complete(bookingId: number): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${bookingId}/complete`, {});
  }

  /**
   * Marca una reserva como no asistió (no-show)
   */
  noShow(bookingId: number): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${bookingId}/no-show`, {});
  }

  // =============== UTILIDADES ===============

  /**
   * Obtiene reservas con filtros avanzados
   */
  filter(filters: BookingFilter): Observable<Booking[]> {
    let params = new HttpParams();
    
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.size !== undefined) {
      params = params.set('size', filters.size.toString());
    }

    return this.http.get<Booking[]>(`${this.baseUrl}/filter`, { params });
  }

  /**
   * Verifica si una hora está disponible para reservar
   */
  checkAvailability(restaurantId: number, date: string, time: string, partySize: number): Observable<boolean> {
    const params = new HttpParams()
      .set('date', date)
      .set('time', time)
      .set('partySize', partySize.toString());
    
    return this.http.get<boolean>(`${this.baseUrl}/restaurant/${restaurantId}/availability`, { params });
  }
}
