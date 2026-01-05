import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../services/schedule.service';
import { 
  RestaurantSchedule, 
  ScheduleCreate,
  DayOfWeek,
  DAYS_OF_WEEK,
  DAY_OF_WEEK_LABELS,
  DEFAULT_SCHEDULE,
  formatTime,
  toFullTime
} from '../Interfaces/schedule.model';

interface ScheduleRow {
  dayOfWeek: DayOfWeek;
  dayLabel: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  maxCapacity: number;
  maxCapacityPerSlot: number;
  slotIntervalMinutes: number;
  hasChanges: boolean;
  originalData?: RestaurantSchedule;
}

@Component({
  selector: 'app-schedule-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-config.component.html',
  styleUrl: './schedule-config.component.css'
})
export class ScheduleConfigComponent implements OnInit {
  @Input() restaurantId!: number;
  @Output() saved = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  schedules: ScheduleRow[] = [];
  loading = true;
  saving = false;
  hasUnsavedChanges = false;

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit(): void {
    this.initializeSchedules();
    this.loadSchedules();
  }

  private initializeSchedules(): void {
    // Inicializar con todos los días de la semana
    this.schedules = DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day,
      dayLabel: DAY_OF_WEEK_LABELS[day],
      isOpen: false,
      openTime: '09:00',
      closeTime: '23:00',
      maxCapacity: 50,
      maxCapacityPerSlot: 20,
      slotIntervalMinutes: 30,
      hasChanges: false
    }));
  }

  private loadSchedules(): void {
    this.loading = true;
    
    this.scheduleService.getSchedules(this.restaurantId).subscribe({
      next: (data) => {
        // Actualizar con datos del servidor
        data.forEach(schedule => {
          const row = this.schedules.find(s => s.dayOfWeek === schedule.dayOfWeek);
          if (row) {
            row.isOpen = schedule.isOpen;
            row.openTime = formatTime(schedule.openTime);
            row.closeTime = formatTime(schedule.closeTime);
            row.maxCapacity = schedule.maxCapacity;
            row.maxCapacityPerSlot = schedule.maxCapacityPerSlot;
            row.slotIntervalMinutes = schedule.slotIntervalMinutes;
            row.originalData = schedule;
          }
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading schedules:', err);
        this.loading = false;
        // Si no hay horarios configurados, usar valores por defecto
      }
    });
  }

  onScheduleChange(row: ScheduleRow): void {
    row.hasChanges = true;
    this.hasUnsavedChanges = true;
  }

  toggleDay(row: ScheduleRow): void {
    row.isOpen = !row.isOpen;
    this.onScheduleChange(row);
  }

  async saveSchedules(): Promise<void> {
    this.saving = true;
    const changedRows = this.schedules.filter(s => s.hasChanges);
    
    try {
      // Preparar todos los horarios modificados
      const schedulesToSave: ScheduleCreate[] = changedRows.map(row => ({
        dayOfWeek: row.dayOfWeek,
        isOpen: row.isOpen,
        openTime: toFullTime(row.openTime),
        closeTime: toFullTime(row.closeTime),
        maxCapacity: row.maxCapacity,
        maxCapacityPerSlot: row.maxCapacityPerSlot,
        slotIntervalMinutes: row.slotIntervalMinutes
      }));

      // Guardar todos de una vez usando el endpoint bulk
      await this.scheduleService.saveAllSchedules(this.restaurantId, schedulesToSave).toPromise();
      
      // Marcar como guardados
      changedRows.forEach(row => row.hasChanges = false);
      this.hasUnsavedChanges = false;
      this.saving = false;
      this.saved.emit();
    } catch (err) {
      console.error('Error saving schedules:', err);
      this.saving = false;
      this.error.emit('Error al guardar los horarios');
    }
  }

  copyToAllDays(sourceRow: ScheduleRow): void {
    this.schedules.forEach(row => {
      if (row.dayOfWeek !== sourceRow.dayOfWeek) {
        row.isOpen = sourceRow.isOpen;
        row.openTime = sourceRow.openTime;
        row.closeTime = sourceRow.closeTime;
        row.maxCapacity = sourceRow.maxCapacity;
        row.maxCapacityPerSlot = sourceRow.maxCapacityPerSlot;
        row.slotIntervalMinutes = sourceRow.slotIntervalMinutes;
        row.hasChanges = true;
      }
    });
    this.hasUnsavedChanges = true;
  }

  copyToWeekdays(sourceRow: ScheduleRow): void {
    const weekdays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    this.schedules.forEach(row => {
      if (weekdays.includes(row.dayOfWeek) && row.dayOfWeek !== sourceRow.dayOfWeek) {
        row.isOpen = sourceRow.isOpen;
        row.openTime = sourceRow.openTime;
        row.closeTime = sourceRow.closeTime;
        row.maxCapacity = sourceRow.maxCapacity;
        row.maxCapacityPerSlot = sourceRow.maxCapacityPerSlot;
        row.slotIntervalMinutes = sourceRow.slotIntervalMinutes;
        row.hasChanges = true;
      }
    });
    this.hasUnsavedChanges = true;
  }

  copyToWeekend(sourceRow: ScheduleRow): void {
    const weekend: DayOfWeek[] = ['SATURDAY', 'SUNDAY'];
    this.schedules.forEach(row => {
      if (weekend.includes(row.dayOfWeek) && row.dayOfWeek !== sourceRow.dayOfWeek) {
        row.isOpen = sourceRow.isOpen;
        row.openTime = sourceRow.openTime;
        row.closeTime = sourceRow.closeTime;
        row.maxCapacity = sourceRow.maxCapacity;
        row.maxCapacityPerSlot = sourceRow.maxCapacityPerSlot;
        row.slotIntervalMinutes = sourceRow.slotIntervalMinutes;
        row.hasChanges = true;
      }
    });
    this.hasUnsavedChanges = true;
  }

  resetChanges(): void {
    this.loadSchedules();
    this.hasUnsavedChanges = false;
  }

  get openDaysCount(): number {
    return this.schedules.filter(s => s.isOpen).length;
  }
}
