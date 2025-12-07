import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Favorite, FavoriteToggleResponse } from '../Interfaces/favorite.model';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly baseUrl = 'http://localhost:8080/favorites';
  
  // Cache de IDs de restaurantes favoritos para acceso rápido
  private favoriteIds = new BehaviorSubject<number[]>([]);
  favoriteIds$ = this.favoriteIds.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los favoritos del usuario
   */
  getFavorites(): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(this.baseUrl);
  }

  /**
   * Obtiene solo los restaurantes favoritos
   */
  getFavoriteRestaurants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurants`);
  }

  /**
   * Obtiene solo los IDs de los restaurantes favoritos
   */
  getFavoriteIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/ids`).pipe(
      tap(ids => this.favoriteIds.next(ids))
    );
  }

  /**
   * Verifica si un restaurante está en favoritos
   */
  checkFavorite(restaurantId: number): Observable<{ isFavorite: boolean }> {
    return this.http.get<{ isFavorite: boolean }>(`${this.baseUrl}/check/${restaurantId}`);
  }

  /**
   * Agrega un restaurante a favoritos
   */
  addFavorite(restaurantId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${restaurantId}`, {}).pipe(
      tap(() => {
        const currentIds = this.favoriteIds.value;
        if (!currentIds.includes(restaurantId)) {
          this.favoriteIds.next([...currentIds, restaurantId]);
        }
      })
    );
  }

  /**
   * Quita un restaurante de favoritos
   */
  removeFavorite(restaurantId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${restaurantId}`).pipe(
      tap(() => {
        this.favoriteIds.next(this.favoriteIds.value.filter(id => id !== restaurantId));
      })
    );
  }

  /**
   * Toggle favorito (recomendado)
   */
  toggleFavorite(restaurantId: number): Observable<FavoriteToggleResponse> {
    return this.http.post<FavoriteToggleResponse>(`${this.baseUrl}/${restaurantId}/toggle`, {}).pipe(
      tap(response => {
        const currentIds = this.favoriteIds.value;
        if (response.isFavorite) {
          if (!currentIds.includes(restaurantId)) {
            this.favoriteIds.next([...currentIds, restaurantId]);
          }
        } else {
          this.favoriteIds.next(currentIds.filter(id => id !== restaurantId));
        }
      })
    );
  }

  /**
   * Obtiene el contador de favoritos de un restaurante
   */
  getFavoriteCount(restaurantId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/count/${restaurantId}`);
  }

  /**
   * Verifica si un restaurante está en favoritos (desde cache)
   */
  isFavorite(restaurantId: number): boolean {
    return this.favoriteIds.value.includes(restaurantId);
  }

  /**
   * Carga inicial de favoritos al iniciar sesión
   */
  loadFavorites(): void {
    this.getFavoriteIds().subscribe({
      error: () => this.favoriteIds.next([])
    });
  }

  /**
   * Limpia el cache de favoritos al cerrar sesión
   */
  clearFavorites(): void {
    this.favoriteIds.next([]);
  }
}
