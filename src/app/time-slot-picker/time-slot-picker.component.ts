import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityService } from '../services/availability.service';
import { 
  AvailabilityResponse, 
  TimeSlotDTO, 
  getSlotStatus, 
  SlotStatus,
  formatTime 
} from '../Interfaces/schedule.model';

@Component({
  selector: 'app-time-slot-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-slot-picker.component.html',
  styleUrl: './time-slot-picker.component.css'
})
export class TimeSlotPickerComponent implements OnInit, OnChanges {
  // Inputs
  @Input() restaurantId!: number;
  @Input() date!: string;  // Formato YYYY-MM-DD
  @Input() numPeople: number = 1;
  @Input() selectedTime: string | null = null;

  // Outputs
  @Output() slotSelected = new EventEmitter<TimeSlotDTO>();
  @Output() availabilityLoaded = new EventEmitter<AvailabilityResponse>();
  @Output() errorOccurred = new EventEmitter<string>();

  // State
  availability: AvailabilityResponse | null = null;
  loading = false;
  error: string | null = null;

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit(): void {
    if (this.restaurantId && this.date) {
      this.loadAvailability();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recargar disponibilidad si cambia el restaurante, fecha o número de personas
    if (changes['restaurantId'] || changes['date']) {
      if (this.restaurantId && this.date) {
        this.loadAvailability();
      }
    }
  }

  loadAvailability(): void {
    this.loading = true;
    this.error = null;

    this.availabilityService.getAvailability(this.restaurantId, this.date).subscribe({
      next: (data) => {
        this.availability = data;
        this.loading = false;
        this.availabilityLoaded.emit(data);
      },
      error: (err) => {
        console.error('Error cargando disponibilidad:', err);
        this.error = 'Error al cargar la disponibilidad';
        this.loading = false;
        this.errorOccurred.emit(this.error);
      }
    });
  }

  selectSlot(slot: TimeSlotDTO): void {
    if (this.canSelectSlot(slot)) {
      this.selectedTime = slot.time;
      this.slotSelected.emit(slot);
    }
  }

  canSelectSlot(slot: TimeSlotDTO): boolean {
    return slot.available && slot.remainingCapacity >= this.numPeople;
  }

  getSlotStatusClass(slot: TimeSlotDTO): SlotStatus {
    if (this.selectedTime === slot.time) {
      return 'selected';
    }
    return getSlotStatus(slot, this.numPeople);
  }

  getCapacityText(slot: TimeSlotDTO): string {
    if (!slot.available || slot.remainingCapacity === 0) {
      return 'Completo';
    }
    if (slot.remainingCapacity < this.numPeople) {
      return `Solo ${slot.remainingCapacity} plazas`;
    }
    if (slot.remainingCapacity < slot.maxCapacity * 0.25) {
      return `¡Últimas ${slot.remainingCapacity} plazas!`;
    }
    return `${slot.remainingCapacity} libres`;
  }

  formatSlotTime(time: string): string {
    return formatTime(time);
  }

  // Agrupar slots por período (mañana, tarde, noche)
  get morningSlots(): TimeSlotDTO[] {
    if (!this.availability) return [];
    return this.availability.slots.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 6 && hour < 12;
    });
  }

  get afternoonSlots(): TimeSlotDTO[] {
    if (!this.availability) return [];
    return this.availability.slots.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 12 && hour < 18;
    });
  }

  get eveningSlots(): TimeSlotDTO[] {
    if (!this.availability) return [];
    return this.availability.slots.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 18 || hour < 6;
    });
  }

  get hasSlots(): boolean {
    return (this.availability?.slots?.length || 0) > 0;
  }

  get availableCount(): number {
    if (!this.availability) return 0;
    return this.availability.slots.filter(s => this.canSelectSlot(s)).length;
  }

  refresh(): void {
    this.loadAvailability();
  }
}
