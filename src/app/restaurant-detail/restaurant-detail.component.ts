import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from "@angular/router";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { DatePipe, CommonModule } from '@angular/common';
import { Restaurant } from "../Interfaces/restaurant.model";
import { RestaurantType } from '../Interfaces/restaurantType.model';
import { Menu } from '../Interfaces/menu.model';
import { AuthenticationService } from '../services/authentication.service';
import { User } from '../Interfaces/user.model';
import { Booking } from '../Interfaces/booking.model';
import { Promotion, PromotionType, PROMOTION_TYPE_CONFIG } from '../Interfaces/promotion.model';
import { PromotionService } from '../services/promotion.service';
import { switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CommonModule],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css']
})
export class RestaurantDetailComponent implements OnInit {
  menus: Menu[] = [];
  bookings: Booking[] = [];
  menu: Menu | undefined;
  restaurant: Restaurant | undefined;
  openingTime: Date | undefined;
  restaurantType = RestaurantType;
  restaurants: Restaurant[] = [];
  recommendedRestaurants: Restaurant[] = [];
  showSpinner = true;
  
  // Promociones
  promotions: Promotion[] = [];
  activePromotions: Promotion[] = [];
  PromotionType = PromotionType;
  promotionConfig = PROMOTION_TYPE_CONFIG;

  userId: string | null = null;
  isLoggedin = false;
  collapsed = true;
  userEmail = '';
  isAdmin = false;
  isRestaurant = false;
  user: User | undefined;
  authService: AuthenticationService | undefined;
  canEdit = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private promotionService: PromotionService,
    authService: AuthenticationService  ) {
      this.authService = authService;
      if (this.authService) {
        this.authService.isLoggedin.subscribe(isLoggedin => this.isLoggedin = isLoggedin);
        this.authService.isAdmin.subscribe(isAdmin => this.isAdmin = isAdmin);
        this.authService.isRestaurant.subscribe(isRestaurant => this.isRestaurant = isRestaurant);
        this.authService.userId.subscribe(userId => this.userId = userId);
      }
    }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      const id = params['id'];
      if (!id) return;
      window.scrollTo(0, 0); 

      const restaurantUrl = `http://localhost:8080/restaurant/${id}`;
      timer(500).pipe(
        switchMap(() => this.httpClient.get<Restaurant>(restaurantUrl))).subscribe(restaurant => {
        this.restaurant = restaurant;
        this.showSpinner = false;

        timer(500).pipe(
          switchMap(() => this.httpClient.get<boolean>('http://localhost:8080/restaurants/can-edit/' + id)
        )).subscribe(canEdit => {
          this.canEdit = canEdit;
          this.showSpinner = false;
        });

        const menusUrl = `http://localhost:8080/menus/byRestaurant/${id}`;
        timer(500).pipe(
          switchMap(() =>this.httpClient.get<Menu[]>(menusUrl)))
          .subscribe(Menus => this.menus = Menus);
          this.showSpinner = false;

        const apiUrl = 'http://localhost:8080/restaurant';
        timer(500).pipe(
          switchMap(() => this.httpClient.get<Restaurant[]>(apiUrl))).subscribe(restaurants => {
          this.restaurants = restaurants;
          this.recommendedRestaurants = this.shuffleAndSelectRestaurants(this.restaurants, 3);
          this.showSpinner = false;
        });

        // Cargar promociones activas
        this.promotionService.getRestaurantPromotions(Number(id)).subscribe({
          next: (promos) => {
            this.activePromotions = promos;
          },
          error: (err) => {
            console.error('Error loading promotions:', err);
            this.activePromotions = [];
          }
        });

        
      });
      this.httpClient.get<Booking[]>('http://localhost:8080/bookings/filter-by-restaurant/' + id)
    .subscribe(bookings => this.bookings = bookings);
    });
  }
  private shuffleAndSelectRestaurants(restaurants: Restaurant[], count: number): Restaurant[] {
    let shuffledRestaurants = [...restaurants];
    for (let i = shuffledRestaurants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRestaurants[i], shuffledRestaurants[j]] = [shuffledRestaurants[j], shuffledRestaurants[i]];
    }
    return shuffledRestaurants.slice(0, count);
  }

  getRestaurantType(type?: RestaurantType): string {
    if (type === undefined) return 'No especificado';
    const typeAsString: string = RestaurantType[type as unknown as keyof typeof RestaurantType];
    return typeAsString;
  }
  
  formatTime(time: string | undefined): string {
    return time ? time.substring(0, 5) : '';
  }

  getPromotionIcon(type: PromotionType): string {
    const config = this.promotionConfig[type];
    return config ? config.icon : 'bi-tag';
  }

  getPromotionColor(type: PromotionType): string {
    const config = this.promotionConfig[type];
    return config ? config.color : '#6c757d';
  }

  formatPromotionValue(promo: Promotion): string {
    if (promo.type === PromotionType.PERCENTAGE_DISCOUNT && promo.discountValue) {
      return `${promo.discountValue}% de descuento`;
    }
    if (promo.type === PromotionType.FIXED_DISCOUNT && promo.discountValue) {
      return `${promo.discountValue}€ de descuento`;
    }
    if (promo.type === PromotionType.HAPPY_HOUR) {
      return `Happy Hour`;
    }
    if (promo.type === PromotionType.TWO_FOR_ONE) {
      return `2x1`;
    }
    if (promo.type === PromotionType.FREE_ITEM) {
      return `Artículo gratis`;
    }
    if (promo.type === PromotionType.FIRST_BOOKING) {
      return `Primera reserva`;
    }
    if (promo.type === PromotionType.LOYALTY) {
      return `Programa de fidelidad`;
    }
    return 'Promoción especial';
  }
  
}

