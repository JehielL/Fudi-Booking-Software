import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Login } from '../Interfaces/login.dto';
import { Token } from '../Interfaces/token.dto';
import { AuthenticationService } from '../services/authentication.service';
import { Router, RouterLink } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { switchMap, timer } from 'rxjs';

import { NgbCarousel, NgbCarouselModule, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';
import { Restaurant } from '../Interfaces/restaurant.model';

@Component({
  selector: 'app-login-main',
  standalone: true,
  templateUrl: './login-main.component.html',
  styleUrl: './login-main.component.css',
  imports: [RouterLink, ReactiveFormsModule, NgbCarouselModule]
})
export class LoginMainComponent implements OnInit {
  errorMessage: string = '';
  showSpinner = true;
  images: string[] = [];
  paused = false;
  unpauseOnArrow = false;
  pauseOnIndicator = false;
  pauseOnHover = true;
  pauseOnFocus = true;

  @ViewChild('carousel', { static: true }) carousel: NgbCarousel | undefined;

  togglePaused() {
    if (this.paused) {
      this.carousel?.cycle();
    } else {
      this.carousel?.pause();
    }
    this.paused = !this.paused;
  }

  onSlide(slideEvent: NgbSlideEvent) {
    if (
      this.unpauseOnArrow &&
      slideEvent.paused &&
      (slideEvent.source === NgbSlideEventSource.ARROW_LEFT || slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)
    ) {
      this.togglePaused();
    }
    if (this.pauseOnIndicator && !slideEvent.paused && slideEvent.source === NgbSlideEventSource.INDICATOR) {
      this.togglePaused();
    }
  }
  loginForm = this.fb.group({
    email: [''],
    password: ['']
  });

  constructor(private fb: FormBuilder,
    private httpClient: HttpClient,
    private authService: AuthenticationService,
    private router: Router) { }
  ngOnInit(): void {

    timer(1000).pipe(

    ).subscribe(() => {
      this.showSpinner = false;


    });

    this.loadRestaurantImages();

  }
  save() {
    const login: Login = {
      email: this.loginForm.get('email')?.value ?? '',
      password: this.loginForm.get('password')?.value ?? '',
    };

    this.httpClient.post<Token>('http://localhost:8080/users/login', login).subscribe({
      next: (response) => {
        console.log(response.token);
        this.authService.saveToken(response.token);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        if (err.status === 403) {
          this.errorMessage = 'El usuario o la contraseña son incorrectos';
        }
      }
    });
  }

  private loadRestaurantImages(): void {

    const apiUrl = 'http://localhost:8080/restaurant';

    this.httpClient.get<Restaurant[]>(apiUrl).subscribe({

      next:(restaurants) => {

        if (restaurants.length > 0){

          const validImages = restaurants
          .filter (restaurant => restaurant.status && restaurant.imageUrl?.trim() !== '')
          .map(restaurant => restaurant.imageUrl);

          this.images = this.shuffleArray(validImages).slice(0, 7);
        }
      },
      error: (error) => {
        console.error('Error cargando imagenes desde restaurant', error);
      }

    });

  }

  private shuffleArray(array: string[]) : string[] {
    return array.sort(() => Math.random() - 0.5);
  }


}
