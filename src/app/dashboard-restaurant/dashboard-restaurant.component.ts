import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, interval, timer } from 'rxjs';
import { takeUntil, delay, switchMap } from 'rxjs/operators';

import { DashboardService } from '../services/dashboard.service';
import { BookingService } from '../services/booking.service';
import { PromotionService } from '../services/promotion.service';
import { AuthenticationService } from '../services/authentication.service';

import { Booking } from '../Interfaces/booking.model';
import { Restaurant } from '../Interfaces/restaurant.model';
import { Promotion, PromotionType, PROMOTION_TYPE_CONFIG, PromotionCreate } from '../Interfaces/promotion.model';
import { BookingStatus, BOOKING_STATUS_CONFIG } from '../Interfaces/booking-status.model';
import { 
  DashboardResponse, 
  DashboardQuickStats, 
  DashboardBooking, 
  DashboardMonthlyStats,
  DashboardTodayBooking
} from '../Interfaces/dashboard.model';

// Nuevos componentes FASE 2A
import { ScheduleConfigComponent } from '../schedule-config/schedule-config.component';
import { ClosedDatesComponent } from '../closed-dates/closed-dates.component';
import { AnalyticsDashboardComponent } from '../analytics-dashboard/analytics-dashboard.component';

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  route: string[];
  color: string;
}

interface BookingStatusFilter {
  status: BookingStatus | 'all';
  label: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-dashboard-restaurant',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ScheduleConfigComponent, ClosedDatesComponent, AnalyticsDashboardComponent],
  templateUrl: './dashboard-restaurant.component.html',
  styleUrl: './dashboard-restaurant.component.css'
})
export class DashboardRestaurantComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // =============== ESTADO DE CARGA ===============
  showSpinner = true;
  error = '';
  
  // =============== DATOS DEL RESTAURANTE ===============
  restaurant: Restaurant | null = null;
  restaurants: Restaurant[] = [];  // Lista de todos los restaurantes del usuario
  restaurantId: number | null = null;
  restaurantName = '';
  showRestaurantSelector = false;  // Para toggle del dropdown
  
  // =============== ESTADÍSTICAS DEL DASHBOARD ===============
  dashboardData: DashboardResponse | null = null;
  quickStats: DashboardQuickStats | null = null;
  monthlyStats: DashboardMonthlyStats[] = [];
  
  // =============== RESERVAS ===============
  allBookings: Booking[] = [];
  pendingBookings: DashboardBooking[] = [];
  pendingBookingsFromService: Booking[] = [];  // Fallback desde BookingService
  todayBookings: DashboardTodayBooking[] = [];
  todayBookingsFromService: Booking[] = [];  // Fallback desde BookingService
  upcomingBookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  selectedBookingFilter: BookingStatus | 'all' = 'all';
  
  // Filtros de reservas
  bookingStatusFilters: BookingStatusFilter[] = [];
  bookingSearchTerm = '';
  bookingDateFilter = '';
  
  // =============== PROMOCIONES ===============
  promotions: Promotion[] = [];
  activePromotions: Promotion[] = [];
  featuredPromotions: Promotion[] = [];
  showPromotionForm = false;
  editingPromotion: Promotion | null = null;
  
  // Formulario de nueva promoción
  newPromotion: PromotionCreate = {
    title: '',
    description: '',
    type: PromotionType.PERCENTAGE_DISCOUNT,
    discountValue: 10,
    startDate: '',
    endDate: ''
  };
  
  // =============== CONFIGURACIONES ===============
  PromotionType = PromotionType;
  BookingStatus = BookingStatus;
  PROMOTION_TYPE_CONFIG = PROMOTION_TYPE_CONFIG;
  BOOKING_STATUS_CONFIG = BOOKING_STATUS_CONFIG;
  
  // =============== UI STATE ===============
  activeTab: 'overview' | 'bookings' | 'promotions' | 'analytics' | 'settings' = 'overview';
  showRejectModal = false;
  selectedBookingForAction: DashboardBooking | null = null;
  rejectReason = '';
  currentTime = new Date();
  
  // Acciones rápidas
  quickActions: QuickAction[] = [
    {
      icon: 'bi-calendar-plus',
      label: 'Nueva Reserva',
      description: 'Crear manualmente',
      route: ['/bookings', 'create'],
      color: '#667eea'
    },
    {
      icon: 'bi-megaphone',
      label: 'Nueva Promoción',
      description: 'Atraer clientes',
      route: [],
      color: '#f59e0b'
    },
    {
      icon: 'bi-book',
      label: 'Gestionar Menú',
      description: 'Actualizar carta',
      route: ['/menus'],
      color: '#10b981'
    },
    {
      icon: 'bi-gear',
      label: 'Configuración',
      description: 'Ajustes del local',
      route: [],
      color: '#8b5cf6'
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private bookingService: BookingService,
    private promotionService: PromotionService,
    private authService: AuthenticationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserRestaurant();
    this.startClock();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =============== INICIALIZACIÓN ===============

  private startClock(): void {
    interval(60000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  private loadUserRestaurant(): void {
    this.http.get<Restaurant[]>('http://localhost:8080/my-restaurants').subscribe({
      next: (restaurants) => {
        if (restaurants && restaurants.length > 0) {
          this.restaurants = restaurants;  // Guardar todos los restaurantes
          this.restaurant = restaurants[0];
          this.restaurantId = restaurants[0].id;
          this.restaurantName = restaurants[0].name || 'Mi Restaurante';
          this.loadAllData();
        } else {
          this.error = 'No tienes un restaurante asociado';
          this.showSpinner = false;
        }
      },
      error: (err) => {
        console.error('Error loading restaurants:', err);
        this.error = 'Error al cargar datos del restaurante';
        this.showSpinner = false;
      }
    });
  }

  // Método para cambiar de restaurante
  selectRestaurant(restaurant: Restaurant): void {
    this.restaurant = restaurant;
    this.restaurantId = restaurant.id;
    this.restaurantName = restaurant.name || 'Mi Restaurante';
    this.showRestaurantSelector = false;
    
    // Resetear datos y recargar
    this.pendingBookings = [];
    this.pendingBookingsFromService = [];
    this.todayBookings = [];
    this.todayBookingsFromService = [];
    this.allBookings = [];
    this.promotions = [];
    
    this.loadAllData();
  }

  toggleRestaurantSelector(): void {
    this.showRestaurantSelector = !this.showRestaurantSelector;
  }

  private loadAllData(): void {
    if (!this.restaurantId) return;

    // Implementar el mismo patrón que home: timer(500) + delay(500) = mínimo 1 segundo de spinner
    timer(500).pipe(
      switchMap(() => forkJoin({
        dashboard: this.dashboardService.getRestaurantDashboard(this.restaurantId!),
        quickStats: this.dashboardService.getQuickStats(this.restaurantId!),
        pendingBookings: this.bookingService.getByRestaurantAndStatus(this.restaurantId!, BookingStatus.PENDING),
        todayBookings: this.bookingService.getTodayByRestaurant(this.restaurantId!),
        monthlyStats: this.dashboardService.getMonthlyStats(this.restaurantId!),
        allBookings: this.bookingService.getByRestaurant(this.restaurantId!),
        upcomingBookings: this.bookingService.getUpcomingByRestaurant(this.restaurantId!),
        allPromotions: this.promotionService.getAllRestaurantPromotions(this.restaurantId!)
      })),
      delay(500)
    ).subscribe({
      next: (data) => {
        this.dashboardData = data.dashboard;
        this.quickStats = data.quickStats;
        
        // Ahora usamos directamente los datos del BookingService (endpoint correcto)
        const pendingBookings = Array.isArray(data.pendingBookings) ? data.pendingBookings : [];
        const todayBookings = Array.isArray(data.todayBookings) ? data.todayBookings : [];
        
        // Guardar como Booking[] para uso directo
        this.pendingBookingsFromService = pendingBookings;
        this.todayBookingsFromService = todayBookings;
        
        this.monthlyStats = Array.isArray(data.monthlyStats) ? data.monthlyStats : [];
        this.allBookings = Array.isArray(data.allBookings) ? data.allBookings : [];
        this.upcomingBookings = Array.isArray(data.upcomingBookings) ? data.upcomingBookings : [];
        this.filteredBookings = this.allBookings;
        this.promotions = Array.isArray(data.allPromotions) ? data.allPromotions : [];
        
        this.activePromotions = this.promotions.filter(p => p.active);
        this.featuredPromotions = this.promotions.filter(p => p.featured);
        
        this.updateBookingStatusFilters();
        this.showSpinner = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        // Fallback: cargar solo lo básico
        this.loadBasicData();
      }
    });
  }

  private loadBasicData(): void {
    if (!this.restaurantId) return;

    timer(500).pipe(
      switchMap(() => forkJoin({
        bookings: this.bookingService.getByRestaurant(this.restaurantId!),
        promotions: this.promotionService.getAllRestaurantPromotions(this.restaurantId!)
      })),
      delay(500)
    ).subscribe({
      next: (data) => {
        this.allBookings = Array.isArray(data.bookings) ? data.bookings : [];
        this.filteredBookings = this.allBookings;
        this.promotions = Array.isArray(data.promotions) ? data.promotions : [];
        this.activePromotions = this.promotions.filter(p => p.active);
        this.updateBookingStatusFilters();
        this.showSpinner = false;
      },
      error: (err) => {
        console.error('Error loading basic data:', err);
        this.error = 'Error al cargar los datos';
        this.showSpinner = false;
      }
    });
  }

  // =============== GETTERS COMPUTADOS ===============

  get totalBookings(): number {
    return this.allBookings.length;
  }

  get totalPeople(): number {
    return this.allBookings.reduce((sum, b) => sum + (b.numUsers || 0), 0);
  }

  get premiumBookings(): number {
    return this.allBookings.filter(b => b.isPremium).length;
  }

  get todayBookingsCount(): number {
    return this.quickStats?.todayBookings || this.todayBookingsDisplay.length || this.getTodayBookingsFromAll().length;
  }

  get pendingBookingsCount(): number {
    return this.quickStats?.pendingBookings || this.pendingBookingsDisplay.length || this.getPendingBookingsFromAll().length;
  }

  get monthlyConfirmed(): number {
    return this.quickStats?.monthlyConfirmed || 0;
  }

  get todayPeople(): number {
    return this.quickStats?.todayPeople || this.todayBookingsDisplay.reduce((sum, b) => sum + (b.partySize || b.numPeople || b.numUsers || 1), 0);
  }

  get averageRating(): number {
    return this.dashboardData?.stats?.averageRating || this.restaurant?.averageRating || 0;
  }

  get totalReviews(): number {
    return this.dashboardData?.stats?.totalReviews || 0;
  }

  get activePromotionsCount(): number {
    return this.activePromotions.length;
  }

  // Getters para mostrar reservas pendientes (ahora usa BookingService directamente)
  get pendingBookingsDisplay(): any[] {
    // Usamos pendingBookingsFromService que viene de /bookings/restaurant/{id}/status/PENDING
    if (this.pendingBookingsFromService.length > 0) {
      return this.pendingBookingsFromService.map(b => this.bookingToDisplayFormat(b));
    }
    // Fallback: Filtrar desde allBookings
    return this.getPendingBookingsFromAll();
  }

  // Getters para mostrar reservas de hoy
  get todayBookingsDisplay(): any[] {
    // Usamos todayBookingsFromService que viene de /bookings/restaurant/{id}/today
    if (this.todayBookingsFromService.length > 0) {
      return this.todayBookingsFromService.map(b => this.bookingToDisplayFormat(b));
    }
    // Fallback: Filtrar desde allBookings
    return this.getTodayBookingsFromAll();
  }

  // Convierte un Booking al formato de display
  private bookingToDisplayFormat(b: Booking): any {
    return {
      id: b.id,
      userName: b.user?.firstName ? `${b.user.firstName} ${b.user.lastName || ''}` : (b.contactName || 'Cliente'),
      userEmail: b.user?.email || '',
      userPhone: b.contactPhone || '',
      date: b.bookingDate || this.formatDate(b.createDate) || this.formatDate(b.createdAt) || 'Sin fecha',
      time: b.bookingTime || this.formatTime(b.createDate) || this.formatTime(b.createdAt) || 'Sin hora',
      partySize: b.numPeople || b.numUsers || 1,
      numPeople: b.numPeople || b.numUsers || 1,
      numUsers: b.numUsers || b.numPeople || 1,
      status: this.getBookingStatus(b)
    };
  }

  // Genera lista de pendientes desde allBookings
  private getPendingBookingsFromAll(): any[] {
    const pending = this.allBookings.filter(b => {
      const status = this.getBookingStatus(b);
      return status === BookingStatus.PENDING;
    });
    
    return pending.map(b => ({
      id: b.id,
      userName: b.user?.firstName ? `${b.user.firstName} ${b.user.lastName || ''}` : (b.contactName || 'Cliente'),
      userEmail: b.user?.email || '',
      userPhone: b.contactPhone || '',
      date: b.bookingDate || this.formatDate(b.createDate) || 'Sin fecha',
      time: b.bookingTime || this.formatTime(b.createDate) || 'Sin hora',
      partySize: b.numPeople || b.numUsers || 1,
      numPeople: b.numPeople || b.numUsers || 1,
      numUsers: b.numUsers || b.numPeople || 1,
      status: BookingStatus.PENDING
    }));
  }

  // Genera lista de hoy desde allBookings
  private getTodayBookingsFromAll(): any[] {
    const today = new Date().toISOString().split('T')[0];
    return this.allBookings
      .filter(b => {
        const bookingDate = b.bookingDate || (b.createDate ? new Date(b.createDate as string).toISOString().split('T')[0] : '');
        return bookingDate === today;
      })
      .map(b => ({
        id: b.id,
        userName: b.user?.firstName ? `${b.user.firstName} ${b.user.lastName || ''}` : (b.contactName || 'Cliente'),
        time: b.bookingTime || this.formatTime(b.createDate) || 'Sin hora',
        partySize: b.numPeople || b.numUsers || 1,
        numPeople: b.numPeople || b.numUsers || 1,
        numUsers: b.numUsers || b.numPeople || 1,
        status: this.getBookingStatus(b)
      }));
  }

  // =============== FILTROS DE RESERVAS ===============

  private updateBookingStatusFilters(): void {
    const statusCounts = new Map<BookingStatus | 'all', number>();
    statusCounts.set('all', this.allBookings.length);

    Object.values(BookingStatus).forEach(status => {
      const count = this.allBookings.filter(b => this.getBookingStatus(b) === status).length;
      statusCounts.set(status, count);
    });

    this.bookingStatusFilters = [
      { status: 'all', label: 'Todas', icon: 'bi-list-ul', count: statusCounts.get('all') || 0 },
      { status: BookingStatus.PENDING, label: 'Pendientes', icon: 'bi-hourglass-split', count: statusCounts.get(BookingStatus.PENDING) || 0 },
      { status: BookingStatus.CONFIRMED, label: 'Confirmadas', icon: 'bi-check-circle', count: statusCounts.get(BookingStatus.CONFIRMED) || 0 },
      { status: BookingStatus.COMPLETED, label: 'Completadas', icon: 'bi-trophy', count: statusCounts.get(BookingStatus.COMPLETED) || 0 },
      { status: BookingStatus.CANCELLED, label: 'Canceladas', icon: 'bi-x-circle', count: statusCounts.get(BookingStatus.CANCELLED) || 0 },
      { status: BookingStatus.NO_SHOW, label: 'No asistió', icon: 'bi-person-x', count: statusCounts.get(BookingStatus.NO_SHOW) || 0 }
    ];
  }

  filterBookingsByStatus(status: BookingStatus | 'all'): void {
    this.selectedBookingFilter = status;
    this.applyBookingFilters();
  }

  applyBookingFilters(): void {
    let filtered = [...this.allBookings];

    // Filtrar por estado
    if (this.selectedBookingFilter !== 'all') {
      filtered = filtered.filter(b => this.getBookingStatus(b) === this.selectedBookingFilter);
    }

    // Filtrar por búsqueda
    if (this.bookingSearchTerm) {
      const term = this.bookingSearchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.user?.firstName?.toLowerCase().includes(term) ||
        b.user?.lastName?.toLowerCase().includes(term) ||
        b.user?.email?.toLowerCase().includes(term) ||
        b.observations?.toLowerCase().includes(term)
      );
    }

    // Filtrar por fecha
    if (this.bookingDateFilter) {
      filtered = filtered.filter(b => {
        const dateValue = b.bookingDate || b.createDate || b.createdAt;
        if (!dateValue) return false;
        try {
          const bookingDate = new Date(dateValue as string).toISOString().split('T')[0];
          return bookingDate === this.bookingDateFilter;
        } catch {
          return false;
        }
      });
    }

    this.filteredBookings = filtered;
  }

  // =============== ACCIONES DE RESERVAS ===============

  confirmBooking(booking: DashboardBooking): void {
    this.dashboardService.confirmBooking(booking.id).subscribe({
      next: () => {
        booking.status = BookingStatus.CONFIRMED;
        this.refreshBookings();
      },
      error: (err) => console.error('Error confirming booking:', err)
    });
  }

  openRejectModal(booking: DashboardBooking): void {
    this.selectedBookingForAction = booking;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  submitReject(): void {
    if (!this.selectedBookingForAction) return;

    this.dashboardService.rejectBooking(this.selectedBookingForAction.id, this.rejectReason).subscribe({
      next: () => {
        if (this.selectedBookingForAction) {
          this.selectedBookingForAction.status = BookingStatus.REJECTED;
        }
        this.closeRejectModal();
        this.refreshBookings();
      },
      error: (err) => console.error('Error rejecting booking:', err)
    });
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedBookingForAction = null;
    this.rejectReason = '';
  }

  completeBooking(booking: DashboardBooking | DashboardTodayBooking): void {
    this.dashboardService.completeBooking(booking.id).subscribe({
      next: () => {
        booking.status = BookingStatus.COMPLETED;
        this.refreshBookings();
      },
      error: (err) => console.error('Error completing booking:', err)
    });
  }

  markNoShow(booking: DashboardBooking | DashboardTodayBooking): void {
    if (!confirm('¿Marcar esta reserva como "No asistió"?')) return;

    this.dashboardService.noShowBooking(booking.id).subscribe({
      next: () => {
        booking.status = BookingStatus.NO_SHOW;
        this.refreshBookings();
      },
      error: (err) => console.error('Error marking no-show:', err)
    });
  }

  cancelBookingFromList(booking: Booking): void {
    const reason = prompt('Motivo de la cancelación (opcional):');
    if (reason === null) return;

    this.bookingService.cancel(booking.id, reason).subscribe({
      next: () => {
        this.refreshBookings();
      },
      error: (err) => console.error('Error cancelling booking:', err)
    });
  }

  confirmBookingFromList(booking: Booking): void {
    this.dashboardService.confirmBooking(booking.id).subscribe({
      next: () => {
        this.refreshBookings();
      },
      error: (err) => console.error('Error confirming booking:', err)
    });
  }

  rejectBookingFromList(booking: Booking): void {
    const reason = prompt('Motivo del rechazo (opcional):');
    if (reason === null) return;

    this.dashboardService.rejectBooking(booking.id, reason).subscribe({
      next: () => {
        this.refreshBookings();
      },
      error: (err) => console.error('Error rejecting booking:', err)
    });
  }

  completeBookingFromList(booking: Booking): void {
    this.dashboardService.completeBooking(booking.id).subscribe({
      next: () => {
        this.refreshBookings();
      },
      error: (err) => console.error('Error completing booking:', err)
    });
  }

  markNoShowFromList(booking: Booking): void {
    if (!confirm('¿Marcar esta reserva como "No asistió"?')) return;

    this.dashboardService.noShowBooking(booking.id).subscribe({
      next: () => {
        this.refreshBookings();
      },
      error: (err) => console.error('Error marking no-show:', err)
    });
  }

  private refreshBookings(): void {
    if (!this.restaurantId) return;

    forkJoin({
      pendingBookings: this.bookingService.getByRestaurantAndStatus(this.restaurantId, BookingStatus.PENDING),
      todayBookings: this.bookingService.getTodayByRestaurant(this.restaurantId),
      allBookings: this.bookingService.getByRestaurant(this.restaurantId),
      quickStats: this.dashboardService.getQuickStats(this.restaurantId)
    }).subscribe({
      next: (data) => {
        this.pendingBookingsFromService = Array.isArray(data.pendingBookings) ? data.pendingBookings : [];
        this.todayBookingsFromService = Array.isArray(data.todayBookings) ? data.todayBookings : [];
        this.allBookings = Array.isArray(data.allBookings) ? data.allBookings : [];
        this.quickStats = data.quickStats;
        this.updateBookingStatusFilters();
        this.applyBookingFilters();
      },
      error: (err) => {
        console.error('Error refreshing bookings:', err);
      }
    });
  }

  // =============== ACCIONES DE PROMOCIONES ===============

  openPromotionForm(): void {
    this.editingPromotion = null;
    this.newPromotion = {
      title: '',
      description: '',
      type: PromotionType.PERCENTAGE_DISCOUNT,
      discountValue: 10,
      startDate: this.getTodayDate(),
      endDate: this.getNextMonthDate(),
      active: true,
      featured: false
    };
    this.showPromotionForm = true;
  }

  editPromotion(promotion: Promotion): void {
    this.editingPromotion = promotion;
    this.newPromotion = {
      title: promotion.title,
      description: promotion.description,
      type: promotion.type,
      discountValue: promotion.discountValue,
      fixedPrice: promotion.fixedPrice,
      startDate: promotion.startDate?.split('T')[0] || '',
      endDate: promotion.endDate?.split('T')[0] || '',
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      validDays: promotion.validDays,
      minPeople: promotion.minPeople,
      maxUses: promotion.maxUses,
      promoCode: promotion.promoCode,
      active: promotion.active,
      featured: promotion.featured
    };
    this.showPromotionForm = true;
  }

  savePromotion(): void {
    if (!this.restaurantId) return;

    if (this.editingPromotion) {
      this.promotionService.updatePromotion(this.editingPromotion.id, this.newPromotion).subscribe({
        next: (updated) => {
          const index = this.promotions.findIndex(p => p.id === updated.id);
          if (index >= 0) this.promotions[index] = updated;
          this.updatePromotionLists();
          this.closePromotionForm();
        },
        error: (err) => console.error('Error updating promotion:', err)
      });
    } else {
      this.promotionService.createPromotion(this.restaurantId, this.newPromotion).subscribe({
        next: (created) => {
          this.promotions.push(created);
          this.updatePromotionLists();
          this.closePromotionForm();
        },
        error: (err) => console.error('Error creating promotion:', err)
      });
    }
  }

  deletePromotion(promotion: Promotion): void {
    if (!confirm(`¿Eliminar la promoción "${promotion.title}"?`)) return;
    
    this.promotionService.deletePromotion(promotion.id).subscribe({
      next: () => {
        this.promotions = this.promotions.filter(p => p.id !== promotion.id);
        this.updatePromotionLists();
      },
      error: (err) => console.error('Error deleting promotion:', err)
    });
  }

  togglePromotionActive(promotion: Promotion): void {
    this.promotionService.toggleActive(promotion.id).subscribe({
      next: (updated) => {
        promotion.active = updated.active;
        this.updatePromotionLists();
      },
      error: (err) => console.error('Error toggling promotion:', err)
    });
  }

  togglePromotionFeatured(promotion: Promotion): void {
    this.promotionService.toggleFeatured(promotion.id).subscribe({
      next: (updated) => {
        promotion.featured = updated.featured;
        this.updatePromotionLists();
      },
      error: (err) => console.error('Error toggling featured:', err)
    });
  }

  closePromotionForm(): void {
    this.showPromotionForm = false;
    this.editingPromotion = null;
  }

  onOverlayMouseDown(event: MouseEvent): void {
    // Solo cerrar si el mousedown fue directamente en el overlay
    if (event.target === event.currentTarget) {
      this.closePromotionForm();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    // Solo cerrar si el click fue directamente en el overlay, no en sus hijos
    if (event.target === event.currentTarget) {
      this.closePromotionForm();
    }
  }

  onRejectOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeRejectModal();
    }
  }

  private updatePromotionLists(): void {
    this.activePromotions = this.promotions.filter(p => p.active);
    this.featuredPromotions = this.promotions.filter(p => p.featured);
  }

  // =============== UTILIDADES ===============

  getBookingStatus(booking: Booking): BookingStatus {
    // Si tiene bookingStatus, usarlo
    if (booking.bookingStatus) {
      return booking.bookingStatus;
    }
    // Fallback: convertir boolean a estado
    if (typeof booking.status === 'boolean') {
      return booking.status ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
    }
    // Si es string, convertirlo a BookingStatus
    if (typeof booking.status === 'string') {
      const statusMap: { [key: string]: BookingStatus } = {
        'PENDING': BookingStatus.PENDING,
        'CONFIRMED': BookingStatus.CONFIRMED,
        'CANCELLED': BookingStatus.CANCELLED,
        'REJECTED': BookingStatus.REJECTED,
        'COMPLETED': BookingStatus.COMPLETED,
        'NO_SHOW': BookingStatus.NO_SHOW
      };
      return statusMap[booking.status.toUpperCase()] || BookingStatus.PENDING;
    }
    return BookingStatus.PENDING;
  }

  getStatusConfig(status: BookingStatus) {
    return BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG[BookingStatus.PENDING];
  }

  getPromotionTypeConfig(type: PromotionType) {
    const config = PROMOTION_TYPE_CONFIG[type];
    return config || PROMOTION_TYPE_CONFIG[PromotionType.PERCENTAGE_DISCOUNT];
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  formatTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  formatDateTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return '';
    return `${this.formatDate(dateString)} ${this.formatTime(dateString)}`;
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getNextMonthDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  }

  refreshData(): void {
    this.showSpinner = true;
    this.error = '';
    this.loadAllData();
  }

  getRestaurantImage(): string {
    if (!this.restaurant?.imageUrl) return '';
    if (this.restaurant.imageUrl.startsWith('http')) {
      return this.restaurant.imageUrl;
    }
    return 'http://localhost:8080/files/' + this.restaurant.imageUrl;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getCurrentTimeFormatted(): string {
    return this.currentTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentDateFormatted(): string {
    return this.currentTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  handleQuickAction(action: QuickAction): void {
    if (action.label === 'Nueva Promoción') {
      this.activeTab = 'promotions';
      setTimeout(() => this.openPromotionForm(), 100);
    } else if (action.label === 'Configuración' && this.restaurant) {
      // Navegar a edición del restaurante
    }
  }

  // Método para calcular el porcentaje de ocupación mensual
  getMonthlyOccupancyTrend(): 'up' | 'down' | 'stable' {
    if (this.monthlyStats.length < 2) return 'stable';
    const current = this.monthlyStats[this.monthlyStats.length - 1]?.totalBookings || 0;
    const previous = this.monthlyStats[this.monthlyStats.length - 2]?.totalBookings || 0;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  getOccupancyPercentageChange(): number {
    if (this.monthlyStats.length < 2) return 0;
    const current = this.monthlyStats[this.monthlyStats.length - 1]?.totalBookings || 0;
    const previous = this.monthlyStats[this.monthlyStats.length - 2]?.totalBookings || 1;
    return Math.round(((current - previous) / previous) * 100);
  }

  // =============== SCHEDULE EVENTS (FASE 2A) ===============

  onScheduleSaved(): void {
    // Mostrar notificación de éxito
    console.log('Horarios guardados correctamente');
    // Aquí podrías añadir un toast/snackbar de éxito
  }

  onScheduleError(message: string): void {
    console.error('Error en horarios:', message);
    // Aquí podrías añadir un toast/snackbar de error
  }

  // =============== ANALYTICS EVENTS ===============

  onAnalyticsLoaded(data: any): void {
    console.log('📊 Analytics cargados:', data);
    // Aquí podrías actualizar otros datos del dashboard basados en analytics
  }

  onAnalyticsError(message: string): void {
    console.error('Error en analytics:', message);
    // Aquí podrías mostrar un toast/snackbar de error
  }
}
