import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, shareReplay, timer } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { 
  WeekdayDistributionResponse, 
  WeekdayChartData, 
  processWeekdayData,
  getDateRangePresets,
  DateRangePreset
} from '../Interfaces/schedule.model';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Servicio para obtener analytics del restaurante.
 * Implementa caché de 5 minutos para evitar llamadas excesivas.
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly baseUrl = 'http://localhost:8080/api/analytics';
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos
  
  // Cache para almacenar resultados
  private weekdayCache = new Map<string, CacheEntry<WeekdayDistributionResponse>>();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la distribución de reservas por día de la semana.
   * 
   * @param restaurantId ID del restaurante
   * @param startDate Fecha inicio (YYYY-MM-DD)
   * @param endDate Fecha fin (YYYY-MM-DD)
   * @param forceRefresh Si es true, ignora el caché
   * @returns Observable con la distribución
   */
  getWeekdayDistribution(
    restaurantId: number, 
    startDate?: string, 
    endDate?: string,
    forceRefresh: boolean = false
  ): Observable<WeekdayDistributionResponse> {
    const cacheKey = `weekday_${restaurantId}_${startDate}_${endDate}`;
    
    // Verificar caché
    if (!forceRefresh) {
      const cached = this.weekdayCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION_MS) {
        console.log('📊 Analytics desde caché:', cacheKey);
        return of(cached.data);
      }
    }

    // Construir parámetros
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<WeekdayDistributionResponse>(
      `${this.baseUrl}/restaurant/${restaurantId}/weekday`,
      { params }
    ).pipe(
      tap(data => {
        // Log para debugging - ver estructura de la respuesta
        console.log('📊 Respuesta raw de API:', JSON.stringify(data, null, 2));
        
        // Guardar en caché
        this.weekdayCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        console.log('📊 Analytics cargado y cacheado:', cacheKey);
      })
    );
  }

  /**
   * Obtiene los datos procesados para visualización en gráficos.
   * 
   * @param restaurantId ID del restaurante
   * @param startDate Fecha inicio
   * @param endDate Fecha fin
   * @param forceRefresh Si es true, ignora el caché
   * @returns Observable con datos procesados para gráficos
   */
  getWeekdayChartData(
    restaurantId: number, 
    startDate?: string, 
    endDate?: string,
    forceRefresh: boolean = false
  ): Observable<{ response: WeekdayDistributionResponse; chartData: WeekdayChartData[] }> {
    return this.getWeekdayDistribution(restaurantId, startDate, endDate, forceRefresh).pipe(
      map(response => {
        // Manejar diferentes estructuras de respuesta del backend
        let dataArray: any[] = [];
        
        if (response.data && Array.isArray(response.data)) {
          // Estructura esperada: { data: [...] }
          dataArray = response.data;
        } else if (Array.isArray(response)) {
          // El backend devuelve directamente el array
          dataArray = response;
        } else if (response && typeof response === 'object') {
          // Buscar cualquier propiedad que sea un array
          const arrayProp = Object.values(response).find(v => Array.isArray(v));
          if (arrayProp) {
            dataArray = arrayProp as any[];
          }
        }
        
        // Convertir formato del backend al formato esperado
        // Backend: { dayOfWeek: 2, dayName: "Lunes", bookings: 2, avgGuests: 4 }
        // Esperado: { weekday: "MONDAY", count: 2 }
        const normalizedData = this.normalizeBackendData(dataArray);
        
        console.log('📊 Data normalizada:', normalizedData);
        
        return {
          response,
          chartData: processWeekdayData(normalizedData)
        };
      })
    );
  }

  /**
   * Normaliza los datos del backend al formato esperado.
   * Backend usa: { dayOfWeek: number (1-7), dayName: string, bookings: number }
   * Frontend espera: { weekday: DayOfWeek, count: number }
   */
  private normalizeBackendData(data: any[]): any[] {
    if (!data || !Array.isArray(data)) return [];
    
    // Mapeo de número de día a DayOfWeek
    const dayNumberToWeekday: Record<number, string> = {
      1: 'SUNDAY',
      2: 'MONDAY', 
      3: 'TUESDAY',
      4: 'WEDNESDAY',
      5: 'THURSDAY',
      6: 'FRIDAY',
      7: 'SATURDAY'
    };

    return data.map(item => {
      // Si ya tiene el formato correcto, devolverlo tal cual
      if (item.weekday && typeof item.count === 'number') {
        return item;
      }
      
      // Convertir del formato del backend
      if (typeof item.dayOfWeek === 'number' && typeof item.bookings === 'number') {
        return {
          weekday: dayNumberToWeekday[item.dayOfWeek] || 'MONDAY',
          count: item.bookings,
          avgGuests: item.avgGuests || 0
        };
      }
      
      // Fallback
      return item;
    });
  }

  /**
   * Obtiene estadísticas resumidas para el dashboard.
   * 
   * @param restaurantId ID del restaurante
   * @param startDate Fecha inicio
   * @param endDate Fecha fin
   */
  getDashboardStats(
    restaurantId: number,
    startDate?: string,
    endDate?: string
  ): Observable<{
    totalReservations: number;
    averagePerDay: number;
    busiestDay: { day: string; count: number } | null;
    slowestDay: { day: string; count: number } | null;
  }> {
    return this.getWeekdayChartData(restaurantId, startDate, endDate).pipe(
      map(({ chartData }) => {
        const total = chartData.reduce((sum, d) => sum + d.count, 0);
        const daysWithData = chartData.filter(d => d.count > 0);
        
        const busiest = chartData.reduce((max, d) => d.count > max.count ? d : max, chartData[0]);
        const slowest = daysWithData.length > 0 
          ? daysWithData.reduce((min, d) => d.count < min.count ? d : min, daysWithData[0])
          : null;

        return {
          totalReservations: total,
          averagePerDay: daysWithData.length > 0 ? Math.round(total / 7) : 0,
          busiestDay: busiest.count > 0 ? { day: busiest.label, count: busiest.count } : null,
          slowestDay: slowest ? { day: slowest.label, count: slowest.count } : null
        };
      })
    );
  }

  /**
   * Limpia el caché de analytics.
   * Llamar cuando se creen/modifiquen reservas o configuración.
   */
  clearCache(): void {
    this.weekdayCache.clear();
    console.log('📊 Caché de analytics limpiado');
  }

  /**
   * Limpia el caché para un restaurante específico.
   */
  clearCacheForRestaurant(restaurantId: number): void {
    const keysToDelete: string[] = [];
    this.weekdayCache.forEach((_, key) => {
      if (key.includes(`_${restaurantId}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.weekdayCache.delete(key));
    console.log(`📊 Caché limpiado para restaurante ${restaurantId}`);
  }

  /**
   * Obtiene los presets de rangos de fecha disponibles.
   */
  getDateRangePresets() {
    return getDateRangePresets();
  }

  /**
   * Obtiene el rango de fechas para un preset dado.
   */
  getRangeForPreset(preset: DateRangePreset): { startDate: string; endDate: string } {
    const presets = getDateRangePresets();
    const found = presets.find(p => p.key === preset);
    return found ? found.getRange() : presets[1].getRange(); // Default: last30days
  }
}
