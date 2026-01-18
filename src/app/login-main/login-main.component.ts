import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Login } from '../Interfaces/login.dto';
import { Token } from '../Interfaces/token.dto';
import { AuthenticationService } from '../services/authentication.service';
import { Router, RouterLink } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { switchMap, timer } from 'rxjs';
import { GoogleAuthService } from '../services/google-auth.service';
import { environment } from '../../environments/environment';

import { NgbCarousel, NgbCarouselModule, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';
import { Restaurant } from '../Interfaces/restaurant.model';

declare const google: any;

@Component({
  selector: 'app-login-main',
  standalone: true,
  templateUrl: './login-main.component.html',
  styleUrl: './login-main.component.css',
  imports: [RouterLink, ReactiveFormsModule, NgbCarouselModule, HttpClientModule]
})
export class LoginMainComponent implements OnInit, AfterViewInit {
  errorMessage: string = '';
  showSpinner = true;
  images: string[] = [];
  paused = false;
  unpauseOnArrow = false;
  pauseOnIndicator = false;
  pauseOnHover = true;
  pauseOnFocus = true;

  @ViewChild('carousel', { static: true }) carousel: NgbCarousel | undefined;
  @ViewChild('googleButton', { static: false }) googleButton!: ElementRef;

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
    private googleAuthService: GoogleAuthService,
    private router: Router) { }
  ngOnInit(): void {

    timer(1000).pipe(

    ).subscribe(() => {
      this.showSpinner = false;
      // Inicializar Google después de que el spinner desaparezca
      setTimeout(() => this.initializeGoogleSignIn(), 100);
    });

    this.loadPredefinedImages();

  }

  ngAfterViewInit(): void {
    // No inicializar aquí - se hace en ngOnInit después del spinner
  }

  private initializeGoogleSignIn(retries = 0): void {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: this.handleGoogleResponse.bind(this)
      });

      if (this.googleButton && this.googleButton.nativeElement) {
        google.accounts.id.renderButton(
          this.googleButton.nativeElement,
          { 
            theme: 'outline', 
            size: 'large',
            text: 'continue_with',
            locale: 'es'
          }
        );
      } else {
        console.error('Elemento googleButton no encontrado');
      }
    } else if (retries < 10) {
      setTimeout(() => this.initializeGoogleSignIn(retries + 1), 200);
    } else {
      console.error('Google API no se pudo cargar después de 10 intentos');
    }
  }

  handleGoogleResponse(response: any): void {
    if (response.credential) {
      this.showSpinner = true;
      
      this.googleAuthService.authenticateWithBackend(response.credential).subscribe({
        next: (authResponse) => {
          // Guardar token y datos del usuario
          this.googleAuthService.saveToken(authResponse.token);
          this.googleAuthService.saveUserData(authResponse);
          
          // También guardar en el servicio de autenticación existente
          this.authService.saveToken(authResponse.token);
          
          this.showSpinner = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Error en autenticación con Google:', error);
          this.errorMessage = 'Error al iniciar sesión con Google. Intenta nuevamente.';
          this.showSpinner = false;
        }
      });
    }
  }
  save() {
    const login: Login = {
      email: this.loginForm.get('email')?.value ?? '',
      password: this.loginForm.get('password')?.value ?? '',
    };

    this.httpClient.post<Token>('https://api.fudi.es/users/login', login).subscribe({
      next: (response) => {
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

  private loadPredefinedImages(): void{

    this.images = [

      'https://i.ibb.co/Tx4hSC0K/brunch.jpg',
      'https://i.ibb.co/Cph0Zhdm/elige.png'
    ]

  }

  private shuffleArray(array: string[]) : string[] {
    return array.sort(() => Math.random() - 0.5);
  }


}
