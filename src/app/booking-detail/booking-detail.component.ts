import { Component, OnInit } from '@angular/core';
import { Booking } from '../Interfaces/booking.model';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbAccordionModule, NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { AuthenticationService } from '../services/authentication.service';
import { Restaurant } from '../Interfaces/restaurant.model';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [NgbAccordionModule, RouterLink, DatePipe, NgbAlert],
  templateUrl: './booking-detail.component.html',
  styleUrl: './booking-detail.component.css'
})
export class BookingDetailComponent implements OnInit {

  booking: Booking | undefined;
  restaurant: Restaurant | undefined;

  showDeleteBookingMessage: boolean = false;
  isAdmin = false;
  isRestaurant = false;
  showSpinner = true;


  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private authService: AuthenticationService) {
    this.authService.isAdmin.subscribe(isAdmin => this.isAdmin = isAdmin);
    this.authService.isRestaurant.subscribe(isRestaurant => this.isRestaurant = isRestaurant);
  }

  ngOnInit(): void {

    window.scrollTo(0, 0);

    this.loadBooking();
    // Carga las reservas al inicializar el componente
  }

  delete(booking: Booking) {
    const url = 'https://gore-metabolism-engine-effects.trycloudflare.com/bookings/' + booking.id;
    this.httpClient.delete(url).subscribe(response => {
      this.booking = undefined;
      this.showDeleteBookingMessage = true;
    });
  }

  loadBooking() {

    this.showSpinner = true;
    this.activatedRoute.params.subscribe(params => {
      const id = params['id'];
      if (!id) return;
      const url = 'https://gore-metabolism-engine-effects.trycloudflare.com/bookings/' + id;
      this.httpClient.get<Booking>(url).subscribe({

        next: b => {

          this.booking = b;
          this.showSpinner = false;
        },
        error: error => {

          console.log("Error al cargar la reserva", error);
          this.showSpinner = false; 

        }
      });

    });
  }

  hideDeletedBookingMessage() {
    this.showDeleteBookingMessage = false;
  }

}