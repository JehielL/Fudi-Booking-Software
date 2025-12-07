import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../services/analytics.service';
import { 
  WeekdayChartData, 
  WeekdayDistributionResponse,
  DateRangePreset,
  DateRangeOption,
  getDateRangePresets
} from '../Interfaces/schedule.model';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.css'
})
export class AnalyticsDashboardComponent implements OnInit, OnChanges {
  @Input() restaurantId!: number;
  @Input() restaurantName: string = '';
  
  @Output() dataLoaded = new EventEmitter<WeekdayDistributionResponse>();
  @Output() errorOccurred = new EventEmitter<string>();

  // Estado
  loading = false;
  error: string | null = null;
  
  // Datos
  chartData: WeekdayChartData[] = [];
  response: WeekdayDistributionResponse | null = null;
  
  // Estadísticas resumidas
  totalReservations = 0;
  averagePerDay = 0;
  busiestDay: { day: string; count: number } | null = null;
  slowestDay: { day: string; count: number } | null = null;
  
  // Selector de rango
  dateRangePresets: DateRangeOption[] = [];
  selectedPreset: DateRangePreset = 'last30days';
  customStartDate: string = '';
  customEndDate: string = '';
  showCustomRange = false;
  
  // Para la barra de progreso visual
  maxCount = 0;

  constructor(private analyticsService: AnalyticsService) {
    this.dateRangePresets = getDateRangePresets();
  }

  ngOnInit(): void {
    this.initializeDates();
    if (this.restaurantId) {
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['restaurantId'] && !changes['restaurantId'].firstChange) {
      this.loadData();
    }
  }

  private initializeDates(): void {
    const range = this.analyticsService.getRangeForPreset(this.selectedPreset);
    this.customStartDate = range.startDate;
    this.customEndDate = range.endDate;
  }

  onPresetChange(): void {
    if (this.selectedPreset === 'custom') {
      this.showCustomRange = true;
    } else {
      this.showCustomRange = false;
      const range = this.analyticsService.getRangeForPreset(this.selectedPreset);
      this.customStartDate = range.startDate;
      this.customEndDate = range.endDate;
      this.loadData();
    }
  }

  applyCustomRange(): void {
    if (this.validateDateRange()) {
      this.loadData();
    }
  }

  private validateDateRange(): boolean {
    if (!this.customStartDate || !this.customEndDate) {
      this.error = 'Selecciona ambas fechas';
      return false;
    }
    if (this.customStartDate > this.customEndDate) {
      this.error = 'La fecha de inicio debe ser anterior a la fecha fin';
      return false;
    }
    return true;
  }

  loadData(forceRefresh: boolean = false): void {
    if (!this.restaurantId) return;

    this.loading = true;
    this.error = null;

    this.analyticsService.getWeekdayChartData(
      this.restaurantId,
      this.customStartDate,
      this.customEndDate,
      forceRefresh
    ).subscribe({
      next: ({ response, chartData }) => {
        this.response = response;
        this.chartData = chartData;
        this.calculateStats(chartData);
        this.loading = false;
        this.dataLoaded.emit(response);
      },
      error: (err) => {
        console.error('Error cargando analytics:', err);
        this.loading = false;
        
        if (err.status === 401 || err.status === 403) {
          this.error = 'No tienes permisos para ver estos datos';
        } else if (err.status === 404) {
          this.error = 'No se encontraron datos de analytics';
        } else if (err.status >= 500) {
          this.error = 'Error del servidor. Intenta más tarde';
        } else {
          this.error = 'No se pudieron cargar los analytics';
        }
        
        this.errorOccurred.emit(this.error);
      }
    });
  }

  private calculateStats(data: WeekdayChartData[]): void {
    this.totalReservations = data.reduce((sum, d) => sum + d.count, 0);
    this.maxCount = Math.max(...data.map(d => d.count), 1);
    
    const daysWithData = data.filter(d => d.count > 0);
    this.averagePerDay = daysWithData.length > 0 
      ? Math.round(this.totalReservations / 7) 
      : 0;

    const busiest = data.reduce((max, d) => d.count > max.count ? d : max, data[0]);
    this.busiestDay = busiest.count > 0 ? { day: busiest.label, count: busiest.count } : null;

    const slowest = daysWithData.length > 0
      ? daysWithData.reduce((min, d) => d.count < min.count ? d : min, daysWithData[0])
      : null;
    this.slowestDay = slowest ? { day: slowest.label, count: slowest.count } : null;
  }

  refresh(): void {
    this.loadData(true);
  }

  getBarWidth(count: number): number {
    return this.maxCount > 0 ? (count / this.maxCount) * 100 : 0;
  }

  getBarColor(item: WeekdayChartData): string {
    if (item.isHighest) return 'var(--primary)';
    if (item.percentage >= 15) return 'var(--secondary)';
    return '#6c757d';
  }

  get hasData(): boolean {
    return this.chartData.some(d => d.count > 0);
  }

  get dateRangeLabel(): string {
    if (!this.customStartDate || !this.customEndDate) return '';
    const start = new Date(this.customStartDate + 'T00:00:00');
    const end = new Date(this.customEndDate + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
  }
}
