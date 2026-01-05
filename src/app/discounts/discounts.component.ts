import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Restaurant } from '../Interfaces/restaurant.model';
import { Promotion, PromotionType, PROMOTION_TYPE_CONFIG } from '../Interfaces/promotion.model';
import { PromotionService } from '../services/promotion.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

interface RestaurantWithPromotions {
  restaurant: Restaurant;
  promotions: Promotion[];
}

@Component({
  selector: 'app-discounts',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './discounts.component.html',
  styleUrl: './discounts.component.css'
})
export class DiscountsComponent implements OnInit {
  restaurantsWithPromotions: RestaurantWithPromotions[] = [];
  showSpinner = true;
  PromotionType = PromotionType;
  promotionConfig = PROMOTION_TYPE_CONFIG;

  constructor(
    private httpClient: HttpClient,
    private promotionService: PromotionService
  ) { }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadRestaurantsWithPromotions();
  }

  loadRestaurantsWithPromotions(): void {
    const apiURL = 'http://localhost:8080/restaurant';
    this.httpClient.get<Restaurant[]>(apiURL).subscribe(restaurants => {
      // Cargar promociones para cada restaurante
      const requests = restaurants.map(restaurant =>
        this.promotionService.getRestaurantPromotions(restaurant.id)
      );

      forkJoin(requests).subscribe({
        next: (promotionsArrays) => {
          this.restaurantsWithPromotions = restaurants
            .map((restaurant, index) => ({
              restaurant,
              promotions: promotionsArrays[index]
            }))
            .filter(item => item.promotions.length > 0); // Solo mostrar restaurantes con promociones
          
          this.showSpinner = false;
        },
        error: () => {
          this.showSpinner = false;
        }
      });
    });
  }

  getPromotionIcon(type: PromotionType): string {
    const config = this.promotionConfig[type];
    return config ? config.icon : 'bi-tag';
  }

  getPromotionColor(type: PromotionType): string {
    const config = this.promotionConfig[type];
    return config ? config.color : '#6c757d';
  }
}
