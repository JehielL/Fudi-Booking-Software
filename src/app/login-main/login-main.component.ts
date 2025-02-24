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

@Component({
    selector: 'app-login-main',
    standalone: true,
    templateUrl: './login-main.component.html',
    styleUrl: './login-main.component.css',
    imports: [RouterLink, FooterComponent, ReactiveFormsModule, NgbCarouselModule]
})
export class LoginMainComponent implements OnInit {
  errorMessage: string = '';
  showSpinner = true;
  images = [62, 83, 466, 965, 982, 1043, 738].map((n) => `https://picsum.photos/id/${n}/900/500`);

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
        private router: Router) {}
  ngOnInit(): void {

    timer(1000).pipe(
        
        ).subscribe(() => {
          this.showSpinner = false;

          
        });

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
        
        
    }
    