import { Restaurant } from "./restaurant.model";
import { User } from "./user.model";
import { BookingStatus } from "./booking-status.model";

export interface Booking {
  id: number;
  createDate?: Date | string;
  createdAt?: Date | string;  // Campo del backend
  updatedAt?: Date | string;
  user?: User;  // Opcional porque puede no venir del backend
  numUsers?: number;
  numPeople?: number;  // Nuevo nombre según OpenAPI
  observations?: string;
  // status puede ser boolean (legacy) o BookingStatus enum (nuevo)
  status?: boolean | BookingStatus | string;
  bookingStatus?: BookingStatus;
  interior?: boolean;
  numTable?: number;
  tableNumber?: number;  // Campo del backend
  restaurant?: Restaurant;
  isPremium?: boolean;
  extraService?: string;
  // Nuevos campos según OpenAPI
  bookingDate?: string;
  bookingTime?: string;
  date?: string;  // Alias para compatibilidad
  time?: string;  // Alias para compatibilidad
  specialRequests?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancellationReason?: string;  // Campo del backend
  // Campos de contacto opcionales
  contactName?: string;
  contactPhone?: string;
  // Campos de notificación
  confirmationSent?: boolean;
  reminderSent?: boolean;
}

// Interfaz para crear una reserva
export interface BookingCreate {
  restaurantId: number;
  numUsers: number;
  bookingDate: string;
  bookingTime: string;
  interior?: boolean;
  observations?: string;
  specialRequests?: string;
  isPremium?: boolean;
}

// Interfaz para actualizar una reserva
export interface BookingUpdate {
  numUsers?: number;
  bookingDate?: string;
  bookingTime?: string;
  interior?: boolean;
  observations?: string;
  specialRequests?: string;
  numTable?: number;
}