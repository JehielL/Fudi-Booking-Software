import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../Interfaces/user.model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Role } from '../Interfaces/role.model';
import { combineLatest, delay, switchMap, timer } from 'rxjs';
import { GoogleAuthService } from '../services/google-auth.service';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../environments/environment';

declare const google: any;


@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})

export class UserFormComponent implements OnInit, AfterViewInit {

  users: User[] = [];
  roles = Role;
  showSpinner = true;

  @ViewChild('googleButtonRegister', { static: false }) googleButtonRegister!: ElementRef;

  registerUserForm = new FormGroup({
    id: new FormControl(0),
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    birthdayDate: new FormControl(new Date()),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(30)]),
    passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(30)]),
    phone: new FormControl(0, [Validators.required, Validators.pattern('^[0-9]{9}$')]),
    role: new FormControl<Role>(Role.USER)
  },
    { validators: this.passwordConfirmValidator }
  );

  constructor(private httpClient: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private googleAuthService: GoogleAuthService,
    private authService: AuthenticationService
  ) { }
  ngOnInit(): void {
    window.scrollTo(0, 0);
    // Ocultar el spinner después de un breve delay
    timer(800).subscribe(() => {
      this.showSpinner = false;
      // Inicializar Google después de que el spinner desaparezca
      setTimeout(() => this.initializeGoogleSignIn(), 100);
    });
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

      if (this.googleButtonRegister && this.googleButtonRegister.nativeElement) {
        google.accounts.id.renderButton(
          this.googleButtonRegister.nativeElement,
          { 
            theme: 'outline', 
            size: 'large',
            text: 'signup_with',
            locale: 'es'
          }
        );
      } else {
        console.error('Elemento googleButtonRegister no encontrado');
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
          console.error('Error en registro con Google:', error);
          this.showSpinner = false;
        }
      });
    }
  }

  passwordConfirmValidator(control: AbstractControl) {

    if (control.get('password')?.value === control.get('passwordConfirm')?.value) {
      return null;

    } else {
      return {
        'confirmError': true
      }
    }
  }


  save() {
    const user: User = this.registerUserForm.value as unknown as User;
    const url = 'https://api.fudi.es/users/register';
    timer(500).pipe(
      switchMap(() => this.httpClient.post<User>(url, user))
    ).subscribe(backendUser => {
      this.router.navigate(['/home']);
      this.showSpinner = false;
    });
  }
}
