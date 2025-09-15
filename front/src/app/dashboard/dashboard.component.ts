import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  ChangeDetectionStrategy,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ExpenseFormComponent } from './expense-form.component';
import * as echarts from 'echarts';

type UpcomingPayment = {
  id: string;
  name: string;
  date: string;
  amount: number;
};

type SubscriptionSummary = {
  id: string;
  name: string;
  amount: number;
  frequency: 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string | null;
  category: string | null;
};

type CategoryStat = {
  category: string;
  count: number;
};

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    CalendarModule,
    ButtonModule,
    DialogModule,
    ExpenseFormComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  message = 'Bonjour !';

  @ViewChild('barChart') barChartRef!: ElementRef;
  private barChartInstance?: echarts.ECharts;
  private readonly barChartOptions = computed<echarts.EChartsOption>(() => {
    const stats = this.categoryStats();
    const labels = stats.map((stat) => stat.category);
    const values = stats.map((stat) => stat.count);

    return {
      title: { text: 'Abonnements par catégorie' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 20 },
      },
      yAxis: {
        type: 'value',
        name: 'Nombre d’abonnements',
        minInterval: 1,
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color: '#6366f1' },
        },
      ],
    } satisfies echarts.EChartsOption;
  });

  readonly upcomingPayments = signal<UpcomingPayment[]>([]);
  readonly subscriptions = signal<SubscriptionSummary[]>([]);
  readonly categoryStats = signal<CategoryStat[]>([]);
  readonly calendarControl = new FormControl<Date[]>([], { nonNullable: true });
  readonly frequencyLabels: Record<SubscriptionSummary['frequency'], string> = {
    MONTHLY: 'Mensuel',
    YEARLY: 'Annuel',
  };
  private apiUrl = 'http://localhost:3000';

  expenseDialogOpen = signal(false);

  constructor(private http: HttpClient, private auth: AuthService) {
    effect(() => {
      if (!this.barChartInstance) {
        return;
      }
      this.barChartInstance.setOption(this.barChartOptions());
    });
  }

  ngOnInit() {
    const token = this.auth.getToken();
    this.http
      .get<{ message: string }>(`${this.apiUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((res) => (this.message = res.message));

    this.loadUpcoming();
    this.loadCategoryStats();
    this.loadSubscriptions();
  }

  ngAfterViewInit() {
    this.barChartInstance = echarts.init(this.barChartRef.nativeElement);
    this.barChartInstance.setOption(this.barChartOptions());
  }

  loadUpcoming() {
    const token = this.auth.getToken();
    this.http
      .get<UpcomingPayment[]>(
        `${this.apiUrl}/dashboard/upcoming-payments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe((events) => {
        this.upcomingPayments.set(events);
        const dates = events.map((event) => new Date(event.date));
        this.calendarControl.setValue(dates, { emitEvent: false });
      });
  }

  loadCategoryStats() {
    const token = this.auth.getToken();
    this.http
      .get<CategoryStat[]>(`${this.apiUrl}/dashboard/category-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((stats) => {
        this.categoryStats.set(stats);
      });
  }

  loadSubscriptions() {
    const token = this.auth.getToken();
    this.http
      .get<SubscriptionSummary[]>(`${this.apiUrl}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((subs) => {
        this.subscriptions.set(subs);
      });
  }

  openExpenseDialog() {
    this.expenseDialogOpen.set(true);
  }

  closeExpenseDialog() {
    this.expenseDialogOpen.set(false);
  }

  handleExpenseSubmit(expense: { name: string; amount: number; date: Date }) {
    const token = this.auth.getToken();
    this.http
      .post(
        `${this.apiUrl}/expenses`,
        {
          name: expense.name,
          amount: expense.amount,
          date: expense.date.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe(() => {
        this.closeExpenseDialog();
        this.loadUpcoming();
      });
  }
}
