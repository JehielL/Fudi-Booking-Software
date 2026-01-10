import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Restaurant } from '../Interfaces/restaurant.model'; 
import { Promotion, PromotionType, PROMOTION_TYPE_CONFIG } from '../Interfaces/promotion.model';
import { PromotionService } from '../services/promotion.service';
import { Router, RouterLink } from '@angular/router';
import { CarruselComponent } from '../carrusel/carrusel.component';
import { User } from '../Interfaces/user.model';
import { AuthenticationService } from '../services/authentication.service';
import { HomeSinLogComponent } from '../home-sin-log/home-sin-log.component';
import { KitchenComponent } from '../kitchen/kitchen.component';
import Aos from 'aos';
import { delay, switchMap, timer, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';

interface RestaurantWithPromotions {
  restaurant: Restaurant;
  promotions: Promotion[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CarruselComponent, HomeSinLogComponent, RouterLink, CommonModule],
})
export class HomeComponent implements OnInit, OnDestroy {
  restaurants: Restaurant[] = [];
  resultadosBusqueda: Restaurant[] = [];
  searchTerm: string = '';
  maxResultados: number = 5; 
  minResultados: number = 5;
  showSpinner = true;
  isLoggedin = false;
  user: User | undefined;
  authService: AuthenticationService | undefined;
  
  // Promociones
  restaurantsWithPromotions: RestaurantWithPromotions[] = [];
  currentPromoPage = 0;
  promosPerPage = 3;
  promoTransitioning = false;
  PromotionType = PromotionType;
  promotionConfig = PROMOTION_TYPE_CONFIG;

  constructor(
    private httpClient: HttpClient, 
    private promotionService: PromotionService,
    authService: AuthenticationService, 
    router: Router
  ) {
    this.authService = authService;
    if (this.authService) {
      this.authService.isLoggedin.subscribe(isLoggedin => this.isLoggedin = isLoggedin);
    }
  }
  puedeMostrarMas: boolean = false;
  showCocinasDropdown: boolean = false;
  backgroundImages: string[] = [
    'https://wallpapercat.com/w/full/4/b/4/584703-3840x2160-desktop-4k-cafe-wallpaper-photo.jpg',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187',
    'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?cs=srgb&dl=pexels-chanwalrus-941861.jpg&fm=jpg',
  ];
  
  currentBackgroundIndex: number = 0;
  
  // Referencias para limpieza de memoria
  private backgroundChangeInterval: any = null;

  ngOnInit(): void {
    window.scrollTo(0, 0);
  
    Aos.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      once: true,
      delay: 100,
      mirror: false
    });
  
    this.loadRestaurants();
    this.loadRestaurantsWithPromotions();
    this.cambiarFondoCadaXSegundos();
  }
  
  currentImage: string = this.backgroundImages[0];
  nextImage: string = '';
  showNextLayer: boolean = false;
  
  cambiarFondoCadaXSegundos(): void {
    let currentIndex = 0;
  
    // Guardar la referencia del interval para poder limpiarlo después
    this.backgroundChangeInterval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % this.backgroundImages.length;
      
      // Precargar la imagen
      const img = new Image();
      img.src = this.backgroundImages[nextIndex];
  
      const onLoadHandler = () => {
        // Asignar la nueva imagen a la capa superior
        this.nextImage = this.backgroundImages[nextIndex];
        
        // Activar el crossfade
        this.showNextLayer = true;
        
        // Después del crossfade, intercambiar capas
        setTimeout(() => {
          this.currentImage = this.backgroundImages[nextIndex];
          this.showNextLayer = false;
          currentIndex = nextIndex;
        }, 2500); // Duración de la transición CSS
        
        // Limpiar el event listener para evitar fugas de memoria
        img.removeEventListener('load', onLoadHandler);
      };
      
      img.addEventListener('load', onLoadHandler);
    }, 5000);
  }
  
  

  loadRestaurants() {
    const apiUrl = 'https://api.fudi.es/restaurant';
    timer(500).pipe(
      switchMap(() => this.httpClient.get<Restaurant[]>(apiUrl)),
      delay(500)
    )
    .subscribe(restaurants => {
      this.restaurants = restaurants;
      this.showSpinner = false;
    });
  }

  buscar(termino: string): void {
    this.searchTerm = termino;
    this.filtrarResultados();
  }

  filtrarResultados(): void {
    const resultadosFiltrados = this.searchTerm
      ? this.restaurants.filter(restaurant =>
          restaurant.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
      : [];
    this.puedeMostrarMas = resultadosFiltrados.length > this.maxResultados;
    this.resultadosBusqueda = resultadosFiltrados.slice(0, this.maxResultados);
  }
  
  mostrarMas(): void {
    this.maxResultados += 5;
    this.filtrarResultados();
  }
  mostrarMenos(): void {
    this.maxResultados = Math.max(this.minResultados, this.maxResultados - 5);
    this.filtrarResultados();
  }

  highlightSearchTerm(name: string, searchTerm: string): string {
    if (!searchTerm) return name;

    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    return name.replace(regex, '$1');
  }
  toggleCocinasDropdown() {
    this.showCocinasDropdown = !this.showCocinasDropdown;
  }

  loadRestaurantsWithPromotions(): void {
    const apiUrl = 'https://api.fudi.es/restaurant';
    
    this.httpClient.get<Restaurant[]>(apiUrl).subscribe(restaurants => {
      const promotionRequests = restaurants.map(restaurant =>
        this.promotionService.getRestaurantPromotions(restaurant.id)
      );

      forkJoin(promotionRequests).subscribe(promotionsArrays => {
        const restaurantsWithPromos = restaurants
          .map((restaurant, index) => ({
            restaurant,
            promotions: promotionsArrays[index]
          }))
          .filter(item => item.promotions.length > 0);

        this.restaurantsWithPromotions = restaurantsWithPromos;
      });
    });
  }

  getPromotionIcon(type: PromotionType): string {
    return PROMOTION_TYPE_CONFIG[type]?.icon || 'bi-tag-fill';
  }

  getPromotionColor(type: PromotionType): string {
    return PROMOTION_TYPE_CONFIG[type]?.color || '#6366f1';
  }

  getCurrentPagePromos(): RestaurantWithPromotions[] {
    const start = this.currentPromoPage * this.promosPerPage;
    const end = start + this.promosPerPage;
    return this.restaurantsWithPromotions.slice(start, end);
  }

  nextPromoPage(): void {
    if (this.hasNextPromoPage() && !this.promoTransitioning) {
      this.promoTransitioning = true;
      setTimeout(() => {
        this.currentPromoPage++;
        setTimeout(() => {
          this.promoTransitioning = false;
        }, 50);
      }, 300);
    }
  }

  prevPromoPage(): void {
    if (this.hasPrevPromoPage() && !this.promoTransitioning) {
      this.promoTransitioning = true;
      setTimeout(() => {
        this.currentPromoPage--;
        setTimeout(() => {
          this.promoTransitioning = false;
        }, 50);
      }, 300);
    }
  }

  hasNextPromoPage(): boolean {
    return (this.currentPromoPage + 1) * this.promosPerPage < this.restaurantsWithPromotions.length;
  }

  hasPrevPromoPage(): boolean {
    return this.currentPromoPage > 0;
  }

  trackByRestaurant(index: number, item: RestaurantWithPromotions): number {
    return item.restaurant.id;
  }

  ngOnDestroy(): void {
    // Limpiar el interval del cambio de fondo para evitar fugas de memoria
    if (this.backgroundChangeInterval) {
      clearInterval(this.backgroundChangeInterval);
      this.backgroundChangeInterval = null;
    }
  }

  Math = Math;
}
