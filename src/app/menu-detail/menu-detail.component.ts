import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbAccordionModule, NgbAlert, NgbAlertModule, NgbModal, NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { Menu } from '../Interfaces/menu.model';
import { Dish } from '../Interfaces/dish.model';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rating, RatingImage, LikeResponse } from '../Interfaces/rating.model';
import { User } from '../Interfaces/user.model';
import { AuthenticationService } from '../services/authentication.service';
import { RestaurantType } from '../Interfaces/restaurantType.model';


@Component({
  selector: 'app-menu-detail',
  standalone: true,
  imports: [ RouterLink, NgbAccordionModule, NgbAlert, NgbRatingModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './menu-detail.component.html',
  styleUrl: './menu-detail.component.css'
})
export class MenuDetailComponent implements OnInit {
  restaurantType = RestaurantType;
  menu: Menu | undefined;
  user: User | undefined;
  isAdmin = false;
  isRestaurant = false;
  authService: AuthenticationService | undefined;
  userId: string | null = null;
  isLoggedin = false;
  showSuccessDeletedRating = false;
  showDeleteMenuMessage = false;
  showErrorDeletedRating = false;
  canEdit = false;

  ratings: Rating[] = [];
  ratingForm = new FormGroup({
    score: new FormControl(5, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(5)] }),
    comment: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(1000)] }),
  });

  dishes: Dish[] = [];
  users: User[] = [];
  showSpinner = true;

  // Variables para las imágenes
  selectedImage1: File | null = null;
  selectedImage2: File | null = null;
  selectedImage3: File | null = null;
  previewImage1: string | null = null;
  previewImage2: string | null = null;
  previewImage3: string | null = null;

  // Lightbox para imágenes
  lightboxImage: string | null = null;

  // Sistema de likes
  likeStatus: Map<number, boolean> = new Map();
  likesLoading: Map<number, boolean> = new Map();

  

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    authService: AuthenticationService,
    private modalService: NgbModal  ) {
      this.authService = authService;
      if (this.authService) {
        this.authService.isLoggedin.subscribe(isLoggedin => this.isLoggedin = isLoggedin);
        this.authService.isAdmin.subscribe(isAdmin => this.isAdmin = isAdmin);
        this.authService.isRestaurant.subscribe(isRestaurant => this.isRestaurant = isRestaurant);
        this.authService.userId.subscribe(userId => this.userId = userId);
      }
    }
  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {

      window.scrollTo(0, 0); 

      const id = params['id'];
      if (!id) return;
      setTimeout(() => {
        this.showSpinner = false;
      }, 1000);
     
      const ratingsUrl = 'https://api.fudi.es/menus/filter-by-menu/' + id;
      const userUrl = 'https://api.fudi.es/user/' + id;
      
      

      const url = 'https://api.fudi.es/menus/' + id;
      this.httpClient.get<Menu>(url).subscribe(m => {
        this.menu = m;
        this.loadRatings();
      });      this.httpClient.get<Rating[]>(ratingsUrl).subscribe(ratings => this.ratings = ratings);
      this.httpClient.get<User[]>(userUrl).subscribe(users => this.users = users);

      this.httpClient.get<Dish[]>('https://api.fudi.es/dishes/filter-by-menu/' + id)
      .subscribe(dishes => this.dishes = dishes);

      this.checkCanEdit(id);
    });
    

    console.log(this.isAdmin);
  }

  checkCanEdit(id: number): void {
    this.httpClient.get<boolean>(`https://api.fudi.es/menus/can-edit/${id}`)
    .subscribe(canEdit => {
        this.canEdit = canEdit;
    }, error => {
        this.canEdit = false;
    });
}

  delete(menu: Menu) {
    const url = 'https://api.fudi.es/menus/' + menu.id;
    this.httpClient.delete(url).subscribe(response => {
      this.menu = undefined;
      this.showDeleteMenuMessage = true;
    });
  }

  hideDeletedMenuMessage() {
    this.showDeleteMenuMessage = false;
  }

  save() {
    if (!this.menu) {
      return;
    }

    const commentControl = this.ratingForm.get('comment');
    const commentValue = (commentControl?.value ?? '').toString().trim();
    if (commentControl && commentControl.value !== commentValue) {
      commentControl.setValue(commentValue);
    }

    if (this.ratingForm.invalid) {
      this.ratingForm.markAllAsTouched();
      return;
    }

    const scoreControlValue = this.ratingForm.get('score')?.value ?? 0;
    const normalizedScore = Math.min(Math.max(Number(scoreControlValue) || 0, 1), 5);
    const integerScore = Math.round(normalizedScore);

    const formData = new FormData();
  formData.append('score', integerScore.toString());
    formData.append('comment', commentValue);
    formData.append('menuId', this.menu.id.toString());

    [this.selectedImage1, this.selectedImage2, this.selectedImage3].forEach(image => {
      if (image) {
        formData.append('images', image);
      }
    });

    this.httpClient.post<Rating>('https://api.fudi.es/ratings', formData).subscribe({
      next: () => {
        this.ratingForm.reset({
          score: 5,
          comment: ''
        });
        this.resetImages();
        this.loadRatings();
      },
      error: error => {
        console.error('Error al guardar el rating:', error);
      }
    });
  }

  resetImages() {
    this.selectedImage1 = null;
    this.selectedImage2 = null;
    this.selectedImage3 = null;
    this.previewImage1 = null;
    this.previewImage2 = null;
    this.previewImage3 = null;
  }

  loadRatings() {
    if (!this.menu) return;

    this.httpClient.get<Rating[]>('https://api.fudi.es/menus/filter-by-menu/' + this.menu.id)
      .subscribe(ratings => {
        console.log('Ratings recibidos del backend:', ratings);
        this.ratings = ratings.map(rating => ({
          ...rating,
          likesCount: rating.likesCount || 0,
          images: (rating.images ?? [])
            .filter(image => !!image?.imagePath)
            .slice()
            .sort((a, b) => a.imageOrder - b.imageOrder)
        }));
        console.log('Ratings procesados:', this.ratings);
        
        // Cargar estado de likes para cada rating si el usuario está logueado
        if (this.isLoggedin) {
          this.loadLikeStatuses();
        }
      });
  }

  loadLikeStatuses() {
    this.ratings.forEach(rating => {
      this.httpClient.get<LikeResponse>(`https://api.fudi.es/ratings/${rating.id}/liked`)
        .subscribe({
          next: (res) => {
            this.likeStatus.set(rating.id, res.liked);
          },
          error: (err) => {
            console.error('Error al verificar like:', err);
            this.likeStatus.set(rating.id, false);
          }
        });
    });
  }

  toggleLike(rating: Rating) {
    if (!this.isLoggedin) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    if (this.likesLoading.get(rating.id)) return;

    this.likesLoading.set(rating.id, true);

    this.httpClient.post<LikeResponse>(`https://api.fudi.es/ratings/${rating.id}/toggle-like`, {})
      .subscribe({
        next: (res) => {
          this.likeStatus.set(rating.id, res.liked);
          rating.likesCount = res.likesCount;
          this.likesLoading.set(rating.id, false);
        },
        error: (err) => {
          console.error('Error al dar like:', err);
          this.likesLoading.set(rating.id, false);
          if (err.status === 401) {
            alert('Debes iniciar sesión para dar like');
          }
        }
      });
  }

  isRatingLiked(ratingId: number): boolean {
    return this.likeStatus.get(ratingId) || false;
  }

  isLikeLoading(ratingId: number): boolean {
    return this.likesLoading.get(ratingId) || false;
  }

  // Métodos para manejar la selección de imágenes
  onImageSelected(event: Event, imageNumber: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Guardar el archivo seleccionado
      if (imageNumber === 1) {
        this.selectedImage1 = file;
        this.createImagePreview(file, 1);
      } else if (imageNumber === 2) {
        this.selectedImage2 = file;
        this.createImagePreview(file, 2);
      } else if (imageNumber === 3) {
        this.selectedImage3 = file;
        this.createImagePreview(file, 3);
      }
    }
  }

  createImagePreview(file: File, imageNumber: number) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (imageNumber === 1) {
        this.previewImage1 = e.target.result;
      } else if (imageNumber === 2) {
        this.previewImage2 = e.target.result;
      } else if (imageNumber === 3) {
        this.previewImage3 = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(imageNumber: number) {
    if (imageNumber === 1) {
      this.selectedImage1 = null;
      this.previewImage1 = null;
    } else if (imageNumber === 2) {
      this.selectedImage2 = null;
      this.previewImage2 = null;
    } else if (imageNumber === 3) {
      this.selectedImage3 = null;
      this.previewImage3 = null;
    }
  }

  resolveFilePath(path?: string | null): string {
    if (!path) {
      return '';
    }
    const normalized = path.trim();
    if (!normalized) {
      return '';
    }
    return normalized.startsWith('http') ? normalized : `https://api.fudi.es/files/${normalized}`;
  }

  resolveUserAvatar(path?: string | null): string {
    const resolved = this.resolveFilePath(path);
    if (resolved) {
      return resolved;
    }
    return '';
  }

  hasUserAvatar(path?: string | null): boolean {
    if (!path) {
      return false;
    }
    return path.trim().length > 0;
  }

  resolveRatingImage(image: RatingImage | undefined): string {
    if (!image) {
      console.log('resolveRatingImage: imagen undefined');
      return '';
    }
    const resolved = this.resolveFilePath(image.imagePath);
    console.log('resolveRatingImage:', image, '-> resolved:', resolved);
    return resolved;
  }

  getUserInitials(user?: User | null): string {
    if (!user) {
      return '??';
    }
    const firstInitial = user.firstName ? user.firstName.charAt(0) : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0) : '';
    const initials = `${firstInitial}${lastInitial}`.trim();
    if (initials) {
      return initials.toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  }

  deleteRating(rating: Rating) {
    this.httpClient.delete('https://api.fudi.es/ratings/' + rating.id)
    .subscribe({
      next: response => {
        this.loadRatings();
        this.showSuccessDeletedRating = true;
      },
      error: error => {
        this.showErrorDeletedRating = true;
      }
    });
  }

  getRestaurantType(type?: RestaurantType): string {
    if (type === undefined) return 'No especificado';
    const typeAsString: string = RestaurantType[type as unknown as keyof typeof RestaurantType];
    return typeAsString;
  }

  openModal(modal: TemplateRef<any>, menu: Menu) {
    this.modalService.open(modal, {
      centered: true
    }).result.then(result => {
      if (result === 'Aceptar') {
        this.delete(menu);
      }
    });
  }

  // Lightbox methods
  openImageLightbox(imageUrl: string) {
    this.lightboxImage = imageUrl;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.lightboxImage = null;
    document.body.style.overflow = '';
  }

}
