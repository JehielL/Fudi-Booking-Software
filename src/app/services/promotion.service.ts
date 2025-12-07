import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Promotion, PromotionCreate, PromotionUpdate } from '../Interfaces/promotion.model';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly baseUrl = 'http://localhost:8080/promotions';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las promociones activas (públicas)
   */
  getActivePromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.baseUrl);
  }

  /**
   * Obtiene promociones destacadas
   */
  getFeaturedPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.baseUrl}/featured`);
  }

  /**
   * Obtiene promociones activas de un restaurante
   */
  getRestaurantPromotions(restaurantId: number): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.baseUrl}/restaurant/${restaurantId}`);
  }

  /**
   * Obtiene TODAS las promociones de un restaurante (incluye inactivas)
   */
  getAllRestaurantPromotions(restaurantId: number): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.baseUrl}/restaurant/${restaurantId}/all`);
  }

  /**
   * Obtiene promociones por ciudad
   */
  getPromotionsByCity(city: string): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.baseUrl}/city/${city}`);
  }

  /**
   * Obtiene una promoción por su ID
   */
  getPromotion(promotionId: number): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.baseUrl}/${promotionId}`);
  }

  /**
   * Valida un código de promoción
   */
  validateCode(code: string, restaurantId: number): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.baseUrl}/validate?code=${code}&restaurantId=${restaurantId}`);
  }

  /**
   * Crea una nueva promoción
   */
  createPromotion(restaurantId: number, promotion: PromotionCreate): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.baseUrl}/restaurant/${restaurantId}`, promotion);
  }

  /**
   * Actualiza una promoción existente
   */
  updatePromotion(promotionId: number, promotion: PromotionUpdate): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.baseUrl}/${promotionId}`, promotion);
  }

  /**
   * Elimina una promoción
   */
  deletePromotion(promotionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${promotionId}`);
  }

  /**
   * Activa o desactiva una promoción
   */
  toggleActive(promotionId: number): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.baseUrl}/${promotionId}/toggle-active`, {});
  }

  /**
   * Marca o desmarca una promoción como destacada
   */
  toggleFeatured(promotionId: number): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.baseUrl}/${promotionId}/toggle-featured`, {});
  }

  /**
   * Aplica una promoción (registra uso)
   */
  applyPromotion(promotionId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${promotionId}/apply`, {});
  }
}
