import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationService } from '../services/authentication.service';
import { User } from '../Interfaces/user.model';
import { HttpClient } from '@angular/common/http';
import { KitchenComponent } from '../kitchen/kitchen.component';
import { Restaurant } from '../Interfaces/restaurant.model';
import { delay, switchMap, timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { BookingService } from '../services/booking.service';
import { BookingStatus } from '../Interfaces/booking-status.model';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgbDropdownModule, RouterLink, KitchenComponent, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{


  title = 'frontend'
  userId: string | null = null;
  isLoggedin = false;
  collapsed = true;
  searchTerm: string = '';

  restaurants: Restaurant[] = [];
  resultadosBusqueda: Restaurant[] = [];
  userEmail = '';
  isAdmin = false;
  isRestaurant = false;
  maxResultados: number = 5; 
  minResultados: number = 5;
  user: User | undefined;
  avatarUrl = '';
  puedeMostrarMas: boolean = false;
  showCocinasDropdown: boolean = false;
  isScrolled = false;
  pendingBookingsCount = 0;
  myRestaurantId: number | null = null;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private httpClient: HttpClient,
    private bookingService: BookingService
    ){

    this.authService.isLoggedin.subscribe(isLoggedin => {
      this.isLoggedin = isLoggedin;
      if(this.isLoggedin) {
        this.httpClient.get<User>('https://api.fudi.es/users/account')
          .subscribe(user => {
            this.user = user;
            if (this.user.imgUser.startsWith('http')) {
              this.avatarUrl = user.imgUser;
            } else {
              this.avatarUrl = 'https://api.fudi.es/files/' + user.imgUser;
            }
          });
      }
    } );
    this.authService.userEmail.subscribe(userEmail => this.userEmail = userEmail);
    this.authService.isAdmin.subscribe(isAdmin => this.isAdmin = isAdmin);
    this.authService.isRestaurant.subscribe(isRestaurant => this.isRestaurant = isRestaurant);
    this.authService.userId.subscribe(userId => this.userId = userId);
    this.authService.avatarUrl.subscribe(avatarUrl => {
      if (avatarUrl.startsWith('http')) {
        this.avatarUrl = avatarUrl;
      } else {
        this.avatarUrl = 'https://api.fudi.es/files/' + avatarUrl;
      }
    
    });
  }


  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 20;
  }
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
  const clickedInside = (event.target as HTMLElement).closest('.navbar');
  if (!clickedInside && !this.collapsed) {
    this.closeNavbar();
  }
}

closeNavbar() {
  this.collapsed = true;
}



  getUserAvatar() {
    if(this.user) {
      return this.user.imgUser;
    } else {
      return '';
    }
  }

  ngOnInit(): void {

    this.loadRestaurants();
    this.loadPendingBookingsCount();
    
    // Recargar contador cada 30 segundos si es admin/restaurant
    if (this.isAdmin || this.isRestaurant) {
      setInterval(() => this.loadPendingBookingsCount(), 30000);
    }
  }

  loadPendingBookingsCount(): void {
    if (!this.isAdmin && !this.isRestaurant) return;
    
    // Si ya tenemos el restaurantId, usarlo directamente
    if (this.myRestaurantId) {
      this.fetchPendingCount(this.myRestaurantId);
      return;
    }

    // Obtener mis restaurantes usando el endpoint específico
    this.httpClient.get<Restaurant[]>('https://api.fudi.es/my-restaurants').subscribe({
      next: restaurants => {
        if (restaurants && restaurants.length > 0) {
          // Tomar el primer restaurante del usuario
          this.myRestaurantId = restaurants[0].id;
          this.fetchPendingCount(restaurants[0].id);
        }
      },
      error: err => console.error('Error cargando mis restaurantes:', err)
    });
  }

  private fetchPendingCount(restaurantId: number): void {
    this.bookingService.getByRestaurantAndStatus(restaurantId, BookingStatus.PENDING).subscribe({
      next: bookings => {
        this.pendingBookingsCount = bookings.length;
      },
      error: err => console.error('Error cargando reservas pendientes:', err)
    });
  }

  toggleCocinasDropdown() {
    this.showCocinasDropdown = !this.showCocinasDropdown;
  }
  toggleNavbar() {
    this.collapsed = !this.collapsed;
  }
  

   loadRestaurants() {
      const apiUrl = 'https://api.fudi.es/restaurant';
      timer(500).pipe(
        switchMap(() => this.httpClient.get<Restaurant[]>(apiUrl)),
        delay(500)
      )
      .subscribe(restaurants => {
        this.restaurants = restaurants;
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
  logout() {

    this.authService.removeToken();
    this.router.navigate(['/home']);
  }
}

