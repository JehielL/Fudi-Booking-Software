import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Booking } from '../Interfaces/booking.model';
import { ActivatedRoute, Router } from '@angular/router';

import { Restaurant } from '../Interfaces/restaurant.model';
import { AuthenticationService } from '../services/authentication.service';
import { User } from '../Interfaces/user.model';
import { TimeSlotPickerComponent } from '../time-slot-picker/time-slot-picker.component';
import { AvailabilityResponse, TimeSlotDTO } from '../Interfaces/schedule.model';
import { PromotionService } from '../services/promotion.service';
import { Promotion } from '../Interfaces/promotion.model';


@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TimeSlotPickerComponent],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.css'
})
export class BookingFormComponent implements OnInit {

  booking: Booking | undefined;
  restaurant: Restaurant | undefined;
  isUpdate: boolean = false; // por defecto estamos en CREAR no en ACTUALIZAR
  isAdmin = false;
  isRestaurant = false;
  authService: AuthenticationService | undefined;
  userId: string | null = null;
  isLoggedin = false;
  user: User | undefined;
  showSpinner = true;
  
  // Propiedades para promociones
  selectedPromotion: Promotion | null = null;
  selectedPromotionId: number | null = null;
  
  // Propiedades para el selector de horarios
  showTimeSlotPicker = false;
  selectedSlot: TimeSlotDTO | null = null;
  showContactSection = false;
  fallbackPhotoUrl = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80';


  bookingForm = new FormGroup({
    id: new FormControl<number>(0),
    bookingDate: new FormControl<string>(''),
    bookingTime: new FormControl<string>(''),
    numPeople: new FormControl<number>(2),
    observations: new FormControl<string>(''),
    interior: new FormControl<boolean>(true),
    specialRequests: new FormControl<string>(''),
    contactName: new FormControl<string>(''),
    contactPhone: new FormControl<string>(''),
  });


  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private httpClient: HttpClient,
    private promotionService: PromotionService,
    authService: AuthenticationService) {
    this.authService = authService;
    if (this.authService) {
      this.authService.isLoggedin.subscribe(isLoggedin => this.isLoggedin = isLoggedin);
      this.authService.isAdmin.subscribe(isAdmin => this.isAdmin = isAdmin);
      this.authService.isRestaurant.subscribe(isRestaurant => this.isRestaurant = isRestaurant);
      this.authService.userId.subscribe(userId => this.userId = userId);
    }
  }




  showFinishMessage = false;

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.showSpinner = true;

    // Cargar datos del usuario logueado
    if (this.userId) {
      this.httpClient.get<User>(`https://api.fudi.es/user/${this.userId}`).subscribe({
        next: user => this.user = user,
        error: err => console.error('Error al cargar usuario:', err)
      });
    }

    // Leer queryParams para posible promoción
    this.activatedRoute.queryParams.subscribe(queryParams => {
      const promotionId = queryParams['promotionId'];
      if (promotionId) {
        this.selectedPromotionId = +promotionId;
        this.loadPromotionDetails(this.selectedPromotionId);
      }
    });

    this.activatedRoute.params.subscribe(params => {

      const id = params['id'];
      if (!id) return;

      this.httpClient.get<Restaurant>(`https://api.fudi.es/restaurant/${id}`).subscribe({

        next: restaurant => {
          this.restaurant = restaurant;
          this.isUpdate = false;
          this.showSpinner = false;

        },
        error: () => {

          this.httpClient.get<Booking>(`https://api.fudi.es/bookings/${id}`).subscribe({
            next: bookingFromBackend => {
              this.isUpdate = true;
              
              const bookingData = {
                id: bookingFromBackend.id,
                bookingDate: bookingFromBackend.bookingDate || '',
                bookingTime: bookingFromBackend.bookingTime?.substring(0, 5) || '', // "20:00:00" -> "20:00"
                numPeople: bookingFromBackend.numUsers || 2,
                observations: bookingFromBackend.observations || '',
                interior: bookingFromBackend.interior ?? true,
                specialRequests: bookingFromBackend.specialRequests || '',
                contactName: '',
                contactPhone: ''
              };
              this.bookingForm.patchValue(bookingData);
              this.restaurant = bookingFromBackend.restaurant;
              this.showSpinner = false;

            },
            error: () => {
              console.error('Error al cargar la reserva o el restaurante:');
              this.showSpinner = false;
            }
          })
        }

      })


    }
    )
  }


  compareObjects(o1: any, o2: any): boolean {

    if (o1 && o2) {
      return o1.id == o2.id;
    }

    return o1 == o2;
  }

  // Método para manejar cambios en la fecha - activa el time slot picker
  onDateChange(): void {
    const date = this.bookingForm.get('bookingDate')?.value;
    if (date && this.restaurant?.id) {
      this.showTimeSlotPicker = true;
      this.selectedSlot = null;
      // Limpiar la hora manual cuando cambia la fecha
      this.bookingForm.patchValue({ bookingTime: '' });
    } else {
      this.showTimeSlotPicker = false;
    }
  }

  // Método para manejar la selección de un slot de tiempo
  onSlotSelected(slot: TimeSlotDTO): void {
    this.selectedSlot = slot;
    // Actualizar el formulario con la hora seleccionada
    this.bookingForm.patchValue({ bookingTime: slot.time });
    console.log('🕐 Slot seleccionado:', slot);
  }

  // Métodos para el selector de personas
  incrementPeople(): void {
    const current = this.bookingForm.get('numPeople')?.value || 2;
    if (current < 20) {
      this.bookingForm.patchValue({ numPeople: current + 1 });
    }
  }

  decrementPeople(): void {
    const current = this.bookingForm.get('numPeople')?.value || 2;
    if (current > 1) {
      this.bookingForm.patchValue({ numPeople: current - 1 });
    }
  }

  // Método para seleccionar interior/terraza
  setInterior(interior: boolean): void {
    this.bookingForm.patchValue({ interior });
  }

  // Toggle para la sección de contacto
  toggleContactSection(): void {
    this.showContactSection = !this.showContactSection;
  }

  // Cargar detalles de la promoción seleccionada
  loadPromotionDetails(promotionId: number): void {
    this.promotionService.getPromotion(promotionId).subscribe({
      next: promotion => {
        this.selectedPromotion = promotion;
        console.log('✅ Promoción cargada:', promotion);
      },
      error: err => {
        console.error('❌ Error al cargar promoción:', err);
        this.selectedPromotionId = null;
      }
    });
  }

  // Remover promoción seleccionada
  removePromotion(): void {
    this.selectedPromotion = null;
    this.selectedPromotionId = null;
  }

  // Formatear fecha para mostrar
  formatDateDisplay(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Selecciona fecha';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      };
      return date.toLocaleDateString('es-ES', options);
    } catch {
      return dateStr;
    }
  }

  get restaurantPhotoUrl(): string {
    const url = (this.restaurant?.imageUrl || '').trim();
    return url || this.fallbackPhotoUrl;
  }


  save() {
    if (!this.restaurant) {
      alert('Debe seleccionar un restaurante');
      return;
    }

    if (!this.userId) {
      alert('Debe iniciar sesión para hacer una reserva');
      return;
    }

    const formValue = this.bookingForm.value;
    
    // Validar campos obligatorios
    if (!formValue.bookingDate || !formValue.bookingTime) {
      alert('Debe seleccionar fecha y hora de la reserva');
      return;
    }

    // Construir el objeto de reserva con el formato EXACTO del backend
    // NO enviar: id, user, status, createdAt, updatedAt, tableNumber
    const booking: any = {
      bookingDate: formValue.bookingDate,  // Formato: "2025-12-15"
      bookingTime: formValue.bookingTime + ':00',  // Formato: "20:00:00"
      numPeople: formValue.numPeople || 2,
      restaurant: { id: this.restaurant.id },
      observations: formValue.observations || '',
      interior: formValue.interior ?? true,
      specialRequests: formValue.specialRequests || '',
      contactName: formValue.contactName || '',
      contactPhone: formValue.contactPhone || ''
    };

    console.log('📤 Enviando reserva:', JSON.stringify(booking, null, 2));

    if (this.isUpdate) {
      const id = formValue.id;
      if (!id || id === 0) {
        alert('ID inválido, no se puede actualizar');
        return;
      }

      const url = `https://api.fudi.es/bookings/${id}`;
      this.httpClient.put<Booking>(url, booking).subscribe({
        next: updated => {
          console.log('✅ Reserva actualizada:', updated);
          this.router.navigate(['/bookings', updated.id, 'detail']);
        },
        error: err => {
          console.error('❌ Error al actualizar reserva', err);
          alert('Error al actualizar reserva: ' + (err.error?.message || err.message || 'Error desconocido'));
        }
      });

    } else {
      const url = 'https://api.fudi.es/bookings';
      this.httpClient.post<Booking>(url, booking).subscribe({
        next: created => {
          console.log('✅ Reserva creada:', created);
          
          // Si hay promoción seleccionada, aplicarla después de crear la reserva
          if (this.selectedPromotionId) {
            this.promotionService.applyPromotion(this.selectedPromotionId).subscribe({
              next: () => console.log('✅ Promoción aplicada correctamente'),
              error: err => console.error('❌ Error al aplicar promoción:', err)
            });
          }
          
          this.router.navigate(['/bookings', created.id, 'detail']);
        },
        error: err => {
          console.error('❌ Error al crear reserva', err);
          console.error('❌ Detalles del error:', err.error);
          alert('Error al crear la reserva: ' + (err.error?.message || err.message || 'Error desconocido'));
        }
      });
    }
  }

}
