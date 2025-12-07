export interface Favorite {
  id: number;
  userId: number;
  restaurantId: number;
  restaurantName: string;
  restaurantImage?: string;
  restaurantAddress?: string;
  restaurantRating?: number;
  createdAt: string;
}

export interface FavoriteToggleResponse {
  isFavorite: boolean;
  message?: string;
}
