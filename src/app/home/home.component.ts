import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Restaurant } from '../Interfaces/restaurant.model'; 
import { Router, RouterLink } from '@angular/router';
import { CarruselComponent } from '../carrusel/carrusel.component';
import { User } from '../Interfaces/user.model';
import { AuthenticationService } from '../services/authentication.service';
import { HomeSinLogComponent } from '../home-sin-log/home-sin-log.component';
import { KitchenComponent } from '../kitchen/kitchen.component';
import Aos from 'aos';
import { delay, switchMap, timer } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CarruselComponent, HomeSinLogComponent, RouterLink, CommonModule],
})
export class HomeComponent implements OnInit {
  restaurants: Restaurant[] = [];
  resultadosBusqueda: Restaurant[] = [];
  searchTerm: string = '';
  maxResultados: number = 5; 
  minResultados: number = 5;
  showSpinner = true;
  isLoggedin = false;
  user: User | undefined;
  authService: AuthenticationService | undefined;
  

  constructor(private httpClient: HttpClient, authService: AuthenticationService, router: Router) {
    this.authService = authService;
    if (this.authService) {
      this.authService.isLoggedin.subscribe(isLoggedin => this.isLoggedin = isLoggedin);
    }
  }
  puedeMostrarMas: boolean = false;
  showCocinasDropdown: boolean = false;
  backgroundImages: string[] = [
    'https://wallpapercat.com/w/full/4/b/4/584703-3840x2160-desktop-4k-cafe-wallpaper-photo.jpg',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187',
    'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?cs=srgb&dl=pexels-chanwalrus-941861.jpg&fm=jpg',
  ];
  
  currentBackgroundIndex: number = 0;
  

  ngOnInit(): void {
    window.scrollTo(0, 0);
  
    Aos.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      once: true,
      delay: 100,
      mirror: false
    });
  
    this.loadRestaurants();
    this.cambiarFondoCadaXSegundos();
  }
  
  currentImage: string = this.backgroundImages[0];
  nextImage: string = '';
  imageFading: boolean = false;
  
  cambiarFondoCadaXSegundos(): void {
    let currentIndex = 0;
  
    setInterval(() => {
      const nextIndex = (currentIndex + 1) % this.backgroundImages.length;
      const img = new Image();
      img.src = this.backgroundImages[nextIndex];
  
      img.onload = () => {
        this.imageFading = true; // activa clase fade-in
  
        setTimeout(() => {
          this.currentImage = this.backgroundImages[nextIndex];
          this.imageFading = false; // resetea animación
          currentIndex = nextIndex;
        }, 1000); // tiempo para hacer el fade-out visual
      };
    }, 8000);
  }
  
  

  loadRestaurants() {
    const apiUrl = 'https://tell-dl-suffering-understood.trycloudflare.com/restaurant';
    timer(500).pipe(
      switchMap(() => this.httpClient.get<Restaurant[]>(apiUrl)),
      delay(500)
    )
    .subscribe(restaurants => {
      this.restaurants = restaurants;
      this.showSpinner = false;
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
  toggleCocinasDropdown() {
    this.showCocinasDropdown = !this.showCocinasDropdown;
  }
}
