import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

declare const google: any;

export interface GoogleAuthResponse {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  imgUser: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly CLIENT_ID = environment.googleClientId;

  constructor(private http: HttpClient) {}

  initGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: this.CLIENT_ID,
          callback: () => {} // Se manejará en cada componente
        });
        resolve();
      } else {
        reject('Google API no disponible');
      }
    });
  }

  renderGoogleButton(element: HTMLElement, callback: (response: any) => void): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        locale: 'es'
      });
      
      google.accounts.id.initialize({
        client_id: this.CLIENT_ID,
        callback: callback
      });
    }
  }

  authenticateWithBackend(idToken: string): Observable<GoogleAuthResponse> {
    return this.http.post<GoogleAuthResponse>(`${this.API_URL}/auth/google`, {
      idToken: idToken
    });
  }

  saveToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  saveUserData(userData: GoogleAuthResponse): void {
    localStorage.setItem('userId', (userData.userId ?? '').toString());
    localStorage.setItem('userEmail', userData.email ?? '');
    localStorage.setItem('userFirstName', userData.firstName ?? '');
    localStorage.setItem('userLastName', userData.lastName ?? '');
    localStorage.setItem('userImg', userData.imgUser ?? '');
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  clearAuth(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userImg');
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
