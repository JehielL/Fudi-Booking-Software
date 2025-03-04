import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Booking } from '../Interfaces/booking.model';
import { ActivatedRoute, Router } from '@angular/router';

import { Menu } from '../Interfaces/menu.model';
import { Restaurant } from '../Interfaces/restaurant.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AuthenticationService } from '../services/authentication.service';
import { User } from '../Interfaces/user.model';


@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
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


  bookingForm = new FormGroup({
    id: new FormControl<number>(0),
    createDate: new FormControl<Date>(new Date()),
    numUsers: new FormControl<number>(0),
    observations: new FormControl<string>(''),
    status: new FormControl<boolean>(true),
    interior: new FormControl<boolean>(true),
    numTable: new FormControl<number>(0),
    restaurant: new FormControl(),
    isPremium: new FormControl<boolean>(false),
    extraService: new FormControl<string>(''),
  });


  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private httpClient: HttpClient,
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
  
    this.activatedRoute.params.subscribe(params => {
      const id = params['id'];
  
      if (!id) return;
  
      // Primero intentamos cargar el restaurante
      this.httpClient.get<Restaurant>(`https://biteapp.store:8080/restaurant/${id}`).subscribe(
        restaurant => {
          this.restaurant = restaurant;
          this.isUpdate = false; // Estamos creando una nueva reserva
          this.showSpinner = false;
        },
        error => {
          // Si el restaurante no existe, intentamos con una reserva
          this.httpClient.get<Booking>(`https://biteapp.store:8080/bookings/${id}`).subscribe(
            bookingFromBackend => {
              this.isUpdate = true; // Estamos editando una reserva existente
              this.bookingForm.patchValue(bookingFromBackend);
              this.restaurant = bookingFromBackend.restaurant;
              this.showSpinner = false;
            },
            () => {
              // Si tampoco es una reserva válida, mostramos un formulario limpio
              this.isUpdate = false;
              this.showSpinner = false;
            }
          );
        }
      );
    });
  }
  

  compareObjects(o1: any, o2: any): boolean {

    if (o1 && o2) {
      return o1.id == o2.id;
    }

    return o1 == o2;
  }


  save() {
    if (!this.restaurant)
      return;
    const booking: Booking = this.bookingForm.value as Booking;
    booking.restaurant = this.restaurant;

    if (this.isUpdate) {
      const url = 'https://biteapp.store:8080/bookings/' + booking.id;
      this.httpClient.put<Booking>(url, booking).subscribe(bookingFromBackend => {
        this.router.navigate(['/bookings', bookingFromBackend.id, 'detail']);
      });

    } else {
      const url = 'https://biteapp.store:8080/bookings';
      this.httpClient.post<Booking>(url, booking).subscribe(bookingFromBackend => {
        this.router.navigate(['/bookings', bookingFromBackend.id, 'detail']);
      });
    }



  };
}
