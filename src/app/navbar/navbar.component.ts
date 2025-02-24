import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationService } from '../services/authentication.service';
import { User } from '../Interfaces/user.model';
import { HttpClient } from '@angular/common/http';
import { KitchenComponent } from '../kitchen/kitchen.component';
import { Restaurant } from '../Interfaces/restaurant.model';
import { delay, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgbDropdownModule, RouterLink, KitchenComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{


  title = 'frontend'
  userId: string | null = null;
  isLoggedin = false;
  collapsed = true;
  searchTerm: string = '';

  restaurants: Restaurant[] = [];
  resultadosBusqueda: Restaurant[] = [];
  userEmail = '';
  isAdmin = false;
  isRestaurant = false;
  maxResultados: number = 5; 
  minResultados: number = 5;
  user: User | undefined;
  avatarUrl = '';
  puedeMostrarMas: boolean = false;
  showCocinasDropdown: boolean = false;
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private httpClient: HttpClient,
    ){

    this.authService.isLoggedin.subscribe(isLoggedin => {
      this.isLoggedin = isLoggedin;
      if(this.isLoggedin) {
        this.httpClient.get<User>('http://localhost:8080/users/account')
          .subscribe(user => {
            this.user = user;
            if (this.user.imgUser.startsWith('http')) {
              this.avatarUrl = user.imgUser;
            } else {
              this.avatarUrl = 'http://localhost:8080/files/' + user.imgUser;
            }
          });
      }
    } );
    this.authService.userEmail.subscribe(userEmail => this.userEmail = userEmail);
    this.authService.isAdmin.subscribe(isAdmin => this.isAdmin = isAdmin);
    this.authService.isRestaurant.subscribe(isRestaurant => this.isRestaurant = isRestaurant);
    this.authService.userId.subscribe(userId => this.userId = userId);
    this.authService.avatarUrl.subscribe(avatarUrl => {
      if (avatarUrl.startsWith('http')) {
        this.avatarUrl = avatarUrl;
      } else {
        this.avatarUrl = 'http://localhost:8080/files/' + avatarUrl;
      }
    
    });
  }

  getUserAvatar() {
    if(this.user) {
      return this.user.imgUser;
    } else {
      return '';
    }
  }

  ngOnInit(): void {

    this.loadRestaurants();
    
  }

  toggleCocinasDropdown() {
    this.showCocinasDropdown = !this.showCocinasDropdown;
  }


   loadRestaurants() {
      const apiUrl = 'http://localhost:8080/restaurant';
      timer(500).pipe(
        switchMap(() => this.httpClient.get<Restaurant[]>(apiUrl)),
        delay(500)
      )
      .subscribe(restaurants => {
        this.restaurants = restaurants;
      });
    }
  
    buscar(termino: string): void {
      this.searchTerm = termino;
      this.filtrarResultados();
    }
  
    filtrarResultados(): void {
      const resultadosFiltrados = this.searchTerm
        ? this.restaurants.filter(restaurant =>
            restaurant.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
        : [];
      this.puedeMostrarMas = resultadosFiltrados.length > this.maxResultados;
      this.resultadosBusqueda = resultadosFiltrados.slice(0, this.maxResultados);
    }
    
    mostrarMas(): void {
      this.maxResultados += 5;
      this.filtrarResultados();
    }
    mostrarMenos(): void {
      this.maxResultados = Math.max(this.minResultados, this.maxResultados - 5);
      this.filtrarResultados();
    }
  
    highlightSearchTerm(name: string, searchTerm: string): string {
      if (!searchTerm) return name;
  
      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
      return name.replace(regex, '$1');
    }
  logout() {

    this.authService.removeToken();
    this.router.navigate(['/home']);
  }
}

