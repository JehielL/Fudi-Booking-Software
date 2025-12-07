import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../services/schedule.service';
import { ClosedDate, ClosedDateCreate } from '../Interfaces/schedule.model';

@Component({
  selector: 'app-closed-dates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './closed-dates.component.html',
  styleUrl: './closed-dates.component.css'
})
export class ClosedDatesComponent implements OnInit {
  @Input() restaurantId!: number;

  closedDates: ClosedDate[] = [];
  loading = true;
  saving = false;
  showForm = false;
  
  // Form fields
  newDate: string = '';
  newReason: string = '';
  newIsRecurring: boolean = false;

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit(): void {
    this.loadClosedDates();
  }

  loadClosedDates(): void {
    this.loading = true;
    
    this.scheduleService.getClosedDates(this.restaurantId).subscribe({
      next: (data) => {
        this.closedDates = data.sort((a, b) => 
          new Date(a.closedDate).getTime() - new Date(b.closedDate).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading closed dates:', err);
        this.closedDates = [];
        this.loading = false;
      }
    });
  }

  openForm(): void {
    this.showForm = true;
    this.newDate = '';
    this.newReason = '';
    this.newIsRecurring = false;
  }

  closeForm(): void {
    this.showForm = false;
  }

  addClosedDate(): void {
    if (!this.newDate) return;

    this.saving = true;
    const closedDate: ClosedDateCreate = {
      closedDate: this.newDate,
      reason: this.newReason || undefined,
      isRecurringYearly: this.newIsRecurring
    };

    this.scheduleService.addClosedDate(this.restaurantId, closedDate).subscribe({
      next: (created) => {
        this.closedDates.push(created);
        this.closedDates.sort((a, b) => 
          new Date(a.closedDate).getTime() - new Date(b.closedDate).getTime()
        );
        this.saving = false;
        this.closeForm();
      },
      error: (err) => {
        console.error('Error adding closed date:', err);
        this.saving = false;
      }
    });
  }

  removeClosedDate(closedDate: ClosedDate): void {
    if (!closedDate.id) return;
    if (!confirm(`¿Eliminar la fecha cerrada del ${this.formatDate(closedDate.closedDate)}?`)) return;

    this.scheduleService.removeClosedDate(this.restaurantId, closedDate.id).subscribe({
      next: () => {
        this.closedDates = this.closedDates.filter(cd => cd.id !== closedDate.id);
      },
      error: (err) => {
        console.error('Error removing closed date:', err);
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  isUpcoming(dateStr: string): boolean {
    return new Date(dateStr) >= new Date();
  }

  isPast(dateStr: string): boolean {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  get upcomingDates(): ClosedDate[] {
    return this.closedDates.filter(cd => this.isUpcoming(cd.closedDate));
  }

  get pastDates(): ClosedDate[] {
    return this.closedDates.filter(cd => this.isPast(cd.closedDate) && !cd.isRecurringYearly);
  }

  get recurringDates(): ClosedDate[] {
    return this.closedDates.filter(cd => cd.isRecurringYearly);
  }

  // Quick add common holidays
  addChristmas(): void {
    const year = new Date().getFullYear();
    this.newDate = `${year}-12-25`;
    this.newReason = 'Navidad';
    this.newIsRecurring = true;
  }

  addNewYear(): void {
    const year = new Date().getFullYear() + 1;
    this.newDate = `${year}-01-01`;
    this.newReason = 'Año Nuevo';
    this.newIsRecurring = true;
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
