import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BookingService } from '../services/booking.service';
import { FavoriteService } from '../services/favorite.service';
import { AuthenticationService } from '../services/authentication.service';

import { User } from '../Interfaces/user.model';
import { Booking } from '../Interfaces/booking.model';
import { Restaurant } from '../Interfaces/restaurant.model';
import { BookingStatus, BOOKING_STATUS_CONFIG } from '../Interfaces/booking-status.model';

interface UserStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  favoriteRestaurants: number;
}

@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.css']
})
export class DashboardUserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // =============== ESTADO DE CARGA ===============
  loading = true;
  error = '';

  // =============== DATOS DEL USUARIO ===============
  user: User | null = null;
  userId: number | null = null;

  // =============== ESTADÍSTICAS ===============
  stats: UserStats = {
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    favoriteRestaurants: 0
  };

  // =============== RESERVAS ===============
  allBookings: Booking[] = [];
  upcomingBookings: Booking[] = [];
  historyBookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  selectedBookingFilter: 'all' | 'upcoming' | 'history' = 'upcoming';

  // =============== FAVORITOS ===============
  favoriteRestaurants: Restaurant[] = [];
  favoriteIds: number[] = [];

  // =============== CONFIGURACIONES ===============
  BookingStatus = BookingStatus;
  BOOKING_STATUS_CONFIG = BOOKING_STATUS_CONFIG;

  // =============== UI STATE ===============
  activeTab: 'overview' | 'bookings' | 'favorites' | 'settings' = 'overview';
  showCancelModal = false;
  selectedBookingForCancel: Booking | null = null;
  cancelReason = '';

  // =============== FORMULARIO PERFIL (legacy support) ===============
  registerUserForm: FormGroup;
  photoFile: File | undefined;
  photoPreview: string | undefined;

  constructor(
    private bookingService: BookingService,
    private favoriteService: FavoriteService,
    private authService: AuthenticationService,
    private http: HttpClient,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.registerUserForm = this.formBuilder.group({
      id: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      imgUser: ['']
    });
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =============== CARGA DE DATOS ===============

  private loadUserData(): void {
    const userIdStr = this.authService.getUserId();
    
    if (!userIdStr) {
      this.error = 'No se ha podido identificar al usuario';
      this.loading = false;
      return;
    }

    this.userId = parseInt(userIdStr, 10);

    // Cargar datos del usuario
    this.http.get<User>(`http://localhost:8080/user/${this.userId}`).subscribe({
      next: (user) => {
        this.user = user;
        this.registerUserForm.patchValue({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          imgUser: user.imgUser
        });
        this.loadAllData();
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Error al cargar datos del usuario';
        this.loading = false;
      }
    });
  }

  private loadAllData(): void {
    forkJoin({
      myBookings: this.bookingService.getMyBookings(),
      upcomingBookings: this.bookingService.getMyUpcomingBookings(),
      historyBookings: this.bookingService.getMyBookingsHistory(),
      favoriteRestaurants: this.favoriteService.getFavoriteRestaurants(),
      favoriteIds: this.favoriteService.getFavoriteIds()
    }).subscribe({
      next: (data) => {
        this.allBookings = data.myBookings;
        this.upcomingBookings = data.upcomingBookings;
        this.historyBookings = data.historyBookings;
        this.favoriteRestaurants = data.favoriteRestaurants;
        this.favoriteIds = data.favoriteIds;

        // Calcular estadísticas
        this.stats = {
          totalBookings: this.allBookings.length,
          upcomingBookings: this.upcomingBookings.length,
          completedBookings: this.historyBookings.filter(b => this.getBookingStatus(b) === BookingStatus.COMPLETED).length,
          favoriteRestaurants: this.favoriteRestaurants.length
        };

        // Filtro inicial
        this.filteredBookings = this.upcomingBookings;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading data:', err);
        // Fallback: cargar solo lo básico
        this.loadBasicData();
      }
    });
  }

  private loadBasicData(): void {
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.allBookings = bookings;
        this.upcomingBookings = bookings.filter(b => this.isUpcoming(b));
        this.historyBookings = bookings.filter(b => !this.isUpcoming(b));
        this.filteredBookings = this.upcomingBookings;

        this.stats = {
          totalBookings: this.allBookings.length,
          upcomingBookings: this.upcomingBookings.length,
          completedBookings: this.historyBookings.length,
          favoriteRestaurants: 0
        };

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.error = 'Error al cargar las reservas';
        this.loading = false;
      }
    });
  }

  // =============== FILTROS ===============

  filterBookings(filter: 'all' | 'upcoming' | 'history'): void {
    this.selectedBookingFilter = filter;
    
    switch (filter) {
      case 'all':
        this.filteredBookings = this.allBookings;
        break;
      case 'upcoming':
        this.filteredBookings = this.upcomingBookings;
        break;
      case 'history':
        this.filteredBookings = this.historyBookings;
        break;
    }
  }

  // =============== ACCIONES DE RESERVAS ===============

  openCancelModal(booking: Booking): void {
    this.selectedBookingForCancel = booking;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedBookingForCancel = null;
    this.cancelReason = '';
  }

  confirmCancel(): void {
    if (!this.selectedBookingForCancel) return;

    this.bookingService.cancel(this.selectedBookingForCancel.id, this.cancelReason).subscribe({
      next: () => {
        this.loadAllData();
        this.closeCancelModal();
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        alert('Error al cancelar la reserva');
      }
    });
  }

  // =============== ACCIONES DE FAVORITOS ===============

  removeFavorite(restaurant: Restaurant): void {
    if (!confirm(`¿Quitar "${restaurant.name}" de favoritos?`)) return;

    this.favoriteService.removeFavorite(restaurant.id).subscribe({
      next: () => {
        this.favoriteRestaurants = this.favoriteRestaurants.filter(r => r.id !== restaurant.id);
        this.favoriteIds = this.favoriteIds.filter(id => id !== restaurant.id);
        this.stats.favoriteRestaurants = this.favoriteRestaurants.length;
      },
      error: (err) => console.error('Error removing favorite:', err)
    });
  }

  // =============== FORMULARIO PERFIL (legacy) ===============

  save(): void {
    const user: User = this.registerUserForm.value as User;
    const url = 'http://localhost:8080/user/' + user.id;
    
    this.http.put<User>(url, user).subscribe({
      next: (backendUser) => {
        this.user = backendUser;
        alert('Perfil actualizado correctamente');
      },
      error: (err) => {
        console.error('Error updating user:', err);
        alert('Error al actualizar el perfil');
      }
    });
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.files === null || target.files.length == 0) {
      return;
    }

    this.photoFile = target.files[0];

    const reader = new FileReader();
    reader.onload = () => this.photoPreview = reader.result as string;
    reader.readAsDataURL(this.photoFile);
  }

  // =============== UTILIDADES ===============

  getBookingStatus(booking: Booking): BookingStatus {
    if (booking.bookingStatus) {
      return booking.bookingStatus;
    }
    if (typeof booking.status === 'boolean') {
      return booking.status ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
    }
    return booking.status as BookingStatus || BookingStatus.PENDING;
  }

  getStatusConfig(status: BookingStatus) {
    return BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG[BookingStatus.PENDING];
  }

  isUpcoming(booking: Booking): boolean {
    const dateValue = booking.bookingDate || booking.createDate || booking.createdAt;
    if (!dateValue) return false;
    const bookingDate = new Date(dateValue as string);
    return bookingDate >= new Date();
  }

  canCancel(booking: Booking): boolean {
    const status = this.getBookingStatus(booking);
    return (status === BookingStatus.PENDING || status === BookingStatus.CONFIRMED) && this.isUpcoming(booking);
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRestaurantImage(restaurant: Restaurant | undefined): string {
    if (!restaurant?.imageUrl) return '';
    if (restaurant.imageUrl.startsWith('http')) {
      return restaurant.imageUrl;
    }
    return 'http://localhost:8080/files/' + restaurant.imageUrl;
  }

  getUserAvatar(): string {
    if (!this.user?.imgUser) return '';
    if (this.user.imgUser.startsWith('http')) {
      return this.user.imgUser;
    }
    return 'http://localhost:8080/files/' + this.user.imgUser;
  }

  getUserInitials(): string {
    if (!this.user) return '';
    const first = this.user.firstName?.charAt(0) || '';
    const last = this.user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  refreshData(): void {
    this.loading = true;
    this.loadAllData();
  }

  navigateToProfile(): void {
    if (this.userId) {
      this.router.navigate(['/user', this.userId, 'detail']);
    }
  }

  navigateToEditProfile(): void {
    if (this.userId) {
      this.router.navigate(['/user', this.userId, 'update']);
    }
  }
}
