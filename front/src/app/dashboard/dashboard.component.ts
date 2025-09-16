import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { ThemeService } from '../services/theme.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import * as echarts from 'echarts';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  currency: string;
  notes?: string;
  category?: {
    id: string;
    name: string;
  };
  payments?: any[];
  _count?: {
    payments: number;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    CalendarModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    InputNumberModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TabViewModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [ConfirmationService, MessageService],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  message = 'Bonjour !';

  @ViewChild('radarChart') radarChartRef!: ElementRef;
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('lineChart') lineChartRef!: ElementRef;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef;

  radarInstance?: echarts.ECharts;
  pieInstance?: echarts.ECharts;
  barInstance?: echarts.ECharts;
  lineInstance?: echarts.ECharts;
  doughnutInstance?: echarts.ECharts;

  radarOptions: echarts.EChartsOption = {};
  pieOptions: echarts.EChartsOption = {};
  barOptions: echarts.EChartsOption = {};
  lineOptions: echarts.EChartsOption = {};
  doughnutOptions: echarts.EChartsOption = {};

  // Service de thème
  private readonly themeService!: ThemeService;

  upcomingPayments: { name: string; date: string; amount: number }[] = [];
  calendarEvents: {
    id: string;
    name: string;
    date: string;
    amount: number;
    status: string;
  }[] = [];
  monthlySummary: {
    todaysTotal: number;
    monthlyTotal: number;
    todaysCount: number;
    monthlyCount: number;
    nextPayment: {
      name: string;
      amount: number;
      date: string;
      daysUntil: number;
    } | null;
  } = {
    todaysTotal: 0,
    monthlyTotal: 0,
    todaysCount: 0,
    monthlyCount: 0,
    nextPayment: null,
  };
  selectedDates: Date[] = [];
  subscriptions: Subscription[] = [];
  selectedSubscription: Subscription | null = null;
  displayEditDialog = false;
  displayAddDialog = false;
  displayDeleteDialog = false;

  // Données pour les statistiques
  monthlyExpenses: { total: number; byCategory: Record<string, number> } = {
    total: 0,
    byCategory: {},
  };
  frequencyDistribution: Record<string, number> = {};
  paymentTimeline: Record<string, number> = {};
  subscriptionTrends: Record<string, number> = {};

  private readonly apiUrl = 'http://localhost:3000';

  categories = [
    { label: 'Streaming', value: 'Streaming' },
    { label: 'Jeux vidéos', value: 'Jeux vidéos' },
    { label: 'Livraisons', value: 'Livraisons' },
    { label: 'Musique', value: 'Musique' },
    { label: 'Sport', value: 'Sport' },
    { label: 'Hobbies', value: 'Hobbies' },
  ];
  frequencies = [
    { label: 'Mensuel', value: 'MONTHLY' },
    { label: 'Annuel', value: 'YEARLY' },
  ];

  subscriptionForm = {
    name: '',
    amount: 0,
    frequency: 'MONTHLY',
    startDate: new Date(),
    category: '',
  };

  addForm = {
    name: '',
    amount: 0,
    frequency: 'MONTHLY',
    startDate: new Date(),
    endDate: null as Date | null,
    category: '',
    notes: '',
  };

  editForm = {
    id: '',
    name: '',
    amount: 0,
    frequency: 'MONTHLY',
    startDate: new Date(),
    endDate: null as Date | null,
    category: '',
    notes: '',
  };

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService
  ) {
    // Injection du service de thème
    this.themeService = inject(ThemeService);

    // Écouter les changements de thème
    if (typeof window !== 'undefined') {
      window.addEventListener('theme-changed', (event: Event) => {
        const customEvent = event as CustomEvent;
        this.onThemeChange(customEvent);
      });
    }
  }

  ngOnInit() {
    const token = this.auth.getToken();
    this.http
      .get<{ message: string }>(`${this.apiUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((res) => (this.message = res.message));

    this.loadSubscriptions();
    this.loadUpcoming();
    this.loadCalendarEvents();
    this.loadMonthlySummary();
    this.loadStats();
    this.loadAllChartData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeCharts();
      this.addCalendarPaymentIndicators();
      this.setupCalendarObserver();
    }, 100);
  }

  setupCalendarObserver() {
    // Observer les changements dans le DOM du calendrier
    const calendarContainer = document.querySelector('.p-calendar');
    if (!calendarContainer) return;

    const observer = new MutationObserver(() => {
      this.scheduleCalendarUpdate();
    });

    observer.observe(calendarContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    // Également écouter les clics sur les boutons de navigation
    this.setupNavigationListeners();
  }

  private setupNavigationListeners() {
    setTimeout(() => {
      const navButtons = document.querySelectorAll(
        '.p-datepicker-prev, .p-datepicker-next'
      );
      navButtons.forEach((button) => {
        button.addEventListener('click', this.handleNavClick.bind(this));
      });
    }, 500);
  }

  private handleNavClick() {
    setTimeout(() => this.addCalendarPaymentIndicators(), 100);
  }

  onCalendarMonthChange() {
    // Extraire le mois et l'année actuellement affichés dans le calendrier
    setTimeout(() => {
      const calendarHeader = document.querySelector('.p-datepicker-title');
      if (calendarHeader) {
        const headerText = calendarHeader.textContent || '';
        const monthYear = this.extractMonthYearFromHeader(headerText);
        if (monthYear) {
          this.loadCalendarEvents(monthYear.month, monthYear.year);
        } else {
          this.loadCalendarEvents();
        }
      } else {
        this.loadCalendarEvents();
      }
    }, 100);
  }

  onCalendarYearChange() {
    // Même logique que pour le changement de mois
    this.onCalendarMonthChange();
  }

  private extractMonthYearFromHeader(
    headerText: string
  ): { month: number; year: number } | null {
    const monthNames = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ];

    const monthMatch = monthNames.find((month) =>
      headerText.toLowerCase().includes(month)
    );

    if (monthMatch) {
      const monthIndex = monthNames.indexOf(monthMatch) + 1; // +1 car l'API attend 1-12
      const yearRegex = /\d{4}/;
      const yearMatch = yearRegex.exec(headerText);
      const year = yearMatch
        ? parseInt(yearMatch[0])
        : new Date().getFullYear();

      return { month: monthIndex, year };
    }

    return null;
  }

  addCalendarPaymentIndicators() {
    setTimeout(() => {
      const calendarContainer = document.querySelector('.p-datepicker');
      if (calendarContainer) {
        // Supprimer toutes les classes has-payment existantes
        const allCells = calendarContainer.querySelectorAll('td');
        allCells.forEach((cell) => {
          cell.classList.remove('has-payment');
        });

        // Ajouter les indicateurs pour les dates avec paiements
        const calendarCells = calendarContainer.querySelectorAll('td span');
        calendarCells.forEach((cell) => {
          const cellElement = cell as HTMLElement;
          const cellDate = this.getCellDate(cellElement);
          if (cellDate && this.hasPaymentOnDate(cellDate)) {
            const parentTd = cellElement.parentElement;
            if (parentTd) {
              parentTd.classList.add('has-payment');
            }
          }
        });
      }
    }, 300);
  }

  getCellDate(cellElement: HTMLElement): Date | null {
    try {
      const dayText = cellElement.textContent?.trim();
      if (!dayText || isNaN(parseInt(dayText))) return null;

      const day = parseInt(dayText);
      const currentDate = new Date();

      // Gérer les différents mois affichés dans le calendrier
      const calendarHeader = document.querySelector('.p-datepicker-title');
      if (calendarHeader) {
        const headerText = calendarHeader.textContent || '';
        const monthNames = [
          'janvier',
          'février',
          'mars',
          'avril',
          'mai',
          'juin',
          'juillet',
          'août',
          'septembre',
          'octobre',
          'novembre',
          'décembre',
        ];

        const monthMatch = monthNames.find((month) =>
          headerText.toLowerCase().includes(month)
        );

        if (monthMatch) {
          const monthIndex = monthNames.indexOf(monthMatch);
          const yearRegex = /\d{4}/;
          const yearMatch = yearRegex.exec(headerText);
          const year = yearMatch
            ? parseInt(yearMatch[0])
            : currentDate.getFullYear();

          return new Date(year, monthIndex, day);
        }
      }

      return new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    } catch {
      return null;
    }
  }

  initializeCharts() {
    if (this.radarChartRef?.nativeElement) {
      this.radarInstance = echarts.init(this.radarChartRef.nativeElement);
      if (Object.keys(this.radarOptions).length) {
        this.radarInstance.setOption(this.radarOptions);
      }
    }

    if (this.pieChartRef?.nativeElement) {
      this.pieInstance = echarts.init(this.pieChartRef.nativeElement);
      if (Object.keys(this.pieOptions).length) {
        this.pieInstance.setOption(this.pieOptions);
      }
    }

    if (this.barChartRef?.nativeElement) {
      this.barInstance = echarts.init(this.barChartRef.nativeElement);
      if (Object.keys(this.barOptions).length) {
        this.barInstance.setOption(this.barOptions);
      }
    }

    if (this.lineChartRef?.nativeElement) {
      this.lineInstance = echarts.init(this.lineChartRef.nativeElement);
      if (Object.keys(this.lineOptions).length) {
        this.lineInstance.setOption(this.lineOptions);
      }
    }

    if (this.doughnutChartRef?.nativeElement) {
      this.doughnutInstance = echarts.init(this.doughnutChartRef.nativeElement);
      if (Object.keys(this.doughnutOptions).length) {
        this.doughnutInstance.setOption(this.doughnutOptions);
      }
    }

    // Redimensionner tous les graphiques après initialisation
    setTimeout(() => {
      this.resizeAllCharts();
    }, 100);
  }

  resizeAllCharts() {
    const charts = [
      this.radarInstance,
      this.pieInstance,
      this.barInstance,
      this.lineInstance,
      this.doughnutInstance,
    ];

    charts.forEach((chart) => {
      if (chart) {
        chart.resize();
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.resizeAllCharts();
  }

  onTabChange(event: any) {
    // Redimensionner les graphiques après changement d'onglet
    setTimeout(() => {
      this.resizeAllCharts();
    }, 100);
  }

  loadUpcoming() {
    const token = this.auth.getToken();
    this.http
      .get<{ name: string; date: string; amount: number }[]>(
        `${this.apiUrl}/dashboard/upcoming-payments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe((events) => {
        this.upcomingPayments = events;
        this.selectedDates = events.map((e) => new Date(e.date));
      });
  }

  loadCalendarEvents(month?: number, year?: number) {
    const token = this.auth.getToken();
    let url = `${this.apiUrl}/dashboard/calendar-events`;

    // Ajouter les paramètres de mois/année si fournis
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());

    if (params.toString()) {
      url += '?' + params.toString();
    }

    this.http
      .get<
        {
          id: string;
          name: string;
          date: string;
          amount: number;
          status: string;
        }[]
      >(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((events) => {
        this.calendarEvents = events;
        // Mettre à jour les dates sélectionnées avec les événements du mois
        this.selectedDates = events.map((e) => new Date(e.date));
        // Reapply calendar indicators after data load
        this.scheduleCalendarUpdate();
      });
  }

  private scheduleCalendarUpdate() {
    // Programmer plusieurs mises à jour pour s'assurer que le calendrier est rendu
    setTimeout(() => this.addCalendarPaymentIndicators(), 100);
    setTimeout(() => this.addCalendarPaymentIndicators(), 500);
    setTimeout(() => this.addCalendarPaymentIndicators(), 1000);
  }

  loadMonthlySummary() {
    const token = this.auth.getToken();
    this.http
      .get<{
        todaysTotal: number;
        monthlyTotal: number;
        todaysCount: number;
        monthlyCount: number;
        nextPayment: {
          name: string;
          amount: number;
          date: string;
          daysUntil: number;
        } | null;
      }>(`${this.apiUrl}/dashboard/monthly-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((summary) => {
        this.monthlySummary = summary;
      });
  }

  getMotivationalMessage(): string {
    const { todaysTotal, todaysCount, nextPayment, monthlyTotal } =
      this.monthlySummary;

    if (todaysCount > 0) {
      return `Aujourd'hui, ${todaysCount} paiement${
        todaysCount > 1 ? 's' : ''
      } prévu${
        todaysCount > 1 ? 's' : ''
      } pour un total de ${todaysTotal.toFixed(2)}€`;
    }

    if (nextPayment) {
      const daysText =
        nextPayment.daysUntil === 1
          ? 'demain'
          : `dans ${nextPayment.daysUntil} jours`;
      return `Aujourd'hui pas de mouvement prévu, mais une dépense ${daysText} : ${
        nextPayment.name
      } (-${nextPayment.amount.toFixed(2)}€)`;
    }

    if (monthlyTotal > 0) {
      return `Ce mois-ci, ${monthlyTotal.toFixed(
        2
      )}€ de dépenses prévues pour vos abonnements`;
    }

    return 'Aucune dépense prévue ce mois-ci ! 🎉';
  }

  hasPaymentOnDate(date: Date): boolean {
    return this.calendarEvents.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }

  getPaymentsForDate(date: Date): typeof this.calendarEvents {
    return this.calendarEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }

  loadStats() {
    const token = this.auth.getToken();
    this.http
      .get<Record<string, number>>(`${this.apiUrl}/dashboard/category-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((stats) => {
        const labels = this.categories.map((c) => c.value);
        const data = labels.map((l) => stats[l] || 0);
        const maxVal = Math.max(...data, 5);
        this.radarOptions = {
          tooltip: {
            trigger: 'item',
          },
          legend: {
            show: false,
          },
          radar: {
            center: ['50%', '50%'],
            radius: '70%',
            splitNumber: 4,
            splitArea: {
              areaStyle: {
                color: [
                  'rgba(16, 185, 129, 0.05)',
                  'transparent',
                  'rgba(16, 185, 129, 0.05)',
                  'transparent',
                ],
              },
            },
            splitLine: {
              lineStyle: {
                color: '#e5e7eb',
              },
            },
            axisLine: {
              lineStyle: {
                color: '#d1d5db',
              },
            },
            indicator: labels.map((name) => ({
              name: name,
              max: maxVal,
            })),
          },
          series: [
            {
              name: 'Abonnements',
              type: 'radar',
              data: [
                {
                  value: data,
                  name: 'Mes abonnements',
                  lineStyle: {
                    color: '#10b981',
                    width: 2,
                  },
                  areaStyle: {
                    color: 'rgba(16, 185, 129, 0.2)',
                  },
                  itemStyle: {
                    color: '#10b981',
                  },
                },
              ],
            },
          ],
        };
        if (this.radarInstance) {
          this.radarInstance.setOption(this.radarOptions);
        }
      });
  }

  loadAllChartData() {
    this.loadMonthlyExpenses();
    this.loadFrequencyDistribution();
    this.loadPaymentTimeline();
    this.loadSubscriptionTrends();
  }

  loadMonthlyExpenses() {
    const token = this.auth.getToken();
    this.http
      .get<{ total: number; byCategory: Record<string, number> }>(
        `${this.apiUrl}/dashboard/monthly-expenses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe((data) => {
        this.monthlyExpenses = data;
        this.updatePieChart();
      });
  }

  loadFrequencyDistribution() {
    const token = this.auth.getToken();
    this.http
      .get<Record<string, number>>(
        `${this.apiUrl}/dashboard/frequency-distribution`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe((data) => {
        this.frequencyDistribution = data;
        this.updateDoughnutChart();
      });
  }

  loadPaymentTimeline() {
    const token = this.auth.getToken();
    this.http
      .get<Record<string, number>>(
        `${this.apiUrl}/dashboard/payment-timeline`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe((data) => {
        this.paymentTimeline = data;
        this.updateLineChart();
      });
  }

  loadSubscriptionTrends() {
    const token = this.auth.getToken();
    this.http
      .get<Record<string, number>>(
        `${this.apiUrl}/dashboard/subscription-trends`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe((data) => {
        this.subscriptionTrends = data;
        this.updateBarChart();
      });
  }

  updatePieChart() {
    const categories = Object.keys(this.monthlyExpenses.byCategory);
    const values = Object.values(this.monthlyExpenses.byCategory);

    this.pieOptions = {
      title: {
        text: 'Dépenses mensuelles par catégorie',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}€ ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: 'Dépenses',
          type: 'pie',
          radius: '50%',
          data: categories.map((cat, index) => ({
            value: values[index],
            name: cat,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };

    if (this.pieInstance) {
      this.pieInstance.setOption(this.pieOptions);
    }
  }

  updateDoughnutChart() {
    const frequencies = Object.keys(this.frequencyDistribution);
    const values = Object.values(this.frequencyDistribution);

    this.doughnutOptions = {
      title: {
        text: 'Répartition par fréquence',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: 'Fréquence',
          type: 'pie',
          radius: ['40%', '70%'],
          data: frequencies.map((freq, index) => ({
            value: values[index],
            name: freq === 'MONTHLY' ? 'Mensuel' : 'Annuel',
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };

    if (this.doughnutInstance) {
      this.doughnutInstance.setOption(this.doughnutOptions);
    }
  }

  updateLineChart() {
    const months = Object.keys(this.paymentTimeline).sort((a, b) =>
      a.localeCompare(b)
    );
    const values = months.map((month) => this.paymentTimeline[month]);

    this.lineOptions = {
      title: {
        text: 'Évolution des paiements',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}€',
      },
      xAxis: {
        type: 'category',
        data: months.map((month) => {
          const date = new Date(month + '-01');
          return date.toLocaleDateString('fr-FR', {
            month: 'short',
            year: 'numeric',
          });
        }),
      },
      yAxis: {
        type: 'value',
        name: 'Montant (€)',
      },
      series: [
        {
          data: values,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#5470c6',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(84, 112, 198, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(84, 112, 198, 0.1)',
                },
              ],
            },
          },
        },
      ],
    };

    if (this.lineInstance) {
      this.lineInstance.setOption(this.lineOptions);
    }
  }

  updateBarChart() {
    const months = Object.keys(this.subscriptionTrends).sort((a, b) =>
      a.localeCompare(b)
    );
    const values = months.map((month) => this.subscriptionTrends[month]);

    this.barOptions = {
      title: {
        text: 'Nouveaux abonnements par mois',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} abonnement(s)',
      },
      xAxis: {
        type: 'category',
        data: months.map((month) => {
          const date = new Date(month + '-01');
          return date.toLocaleDateString('fr-FR', {
            month: 'short',
            year: 'numeric',
          });
        }),
      },
      yAxis: {
        type: 'value',
        name: "Nombre d'abonnements",
      },
      series: [
        {
          data: values,
          type: 'bar',
          itemStyle: {
            color: '#91cc75',
          },
        },
      ],
    };

    if (this.barInstance) {
      this.barInstance.setOption(this.barOptions);
    }
  }

  // Ancienne méthode submit - remplacée par saveNewSubscription
  /*
  submit() {
    const token = this.auth.getToken();
    const body = { ...this.subscriptionForm };
    this.http
      .post(`${this.apiUrl}/subscriptions`, body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe(() => {
        this.subscriptionForm = {
          name: '',
          amount: 0,
          frequency: 'MONTHLY',
          startDate: new Date(),
          category: '',
        };
        this.loadSubscriptions();
        this.loadUpcoming();
        this.loadStats();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Abonnement ajouté avec succès',
        });
      });
  }
  */

  loadSubscriptions() {
    const token = this.auth.getToken();
    this.http
      .get<Subscription[]>(`${this.apiUrl}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((subscriptions) => {
        this.subscriptions = subscriptions;
      });
  }

  editSubscription(subscription: Subscription) {
    this.selectedSubscription = subscription;
    this.editForm = {
      id: subscription.id,
      name: subscription.name,
      amount: subscription.amount,
      frequency: subscription.frequency,
      startDate: new Date(subscription.startDate),
      endDate: subscription.endDate ? new Date(subscription.endDate) : null,
      category: subscription.category?.name || '',
      notes: subscription.notes || '',
    };
    this.displayEditDialog = true;
  }

  confirmDelete(subscription: Subscription) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'abonnement "${subscription.name}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.deleteSubscription(subscription.id);
      },
    });
  }

  getFrequencyLabel(frequency: 'MONTHLY' | 'YEARLY'): string {
    return frequency === 'MONTHLY' ? 'Mensuel' : 'Annuel';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  openAddDialog() {
    this.addForm = {
      name: '',
      amount: 0,
      frequency: 'MONTHLY',
      startDate: new Date(),
      endDate: null,
      category: '',
      notes: '',
    };
    this.displayAddDialog = true;
  }

  closeAddDialog() {
    this.displayAddDialog = false;
  }

  isAddFormValid(): boolean {
    return !!(
      this.addForm.name &&
      this.addForm.amount > 0 &&
      this.addForm.frequency &&
      this.addForm.startDate
    );
  }

  saveNewSubscription() {
    if (!this.isAddFormValid()) return;

    const token = this.auth.getToken();
    const body = {
      name: this.addForm.name,
      amount: this.addForm.amount,
      frequency: this.addForm.frequency,
      startDate: this.addForm.startDate.toISOString(),
      endDate: this.addForm.endDate?.toISOString() || null,
      category: this.addForm.category || null,
      notes: this.addForm.notes || null,
    };

    this.http
      .post(`${this.apiUrl}/subscriptions`, body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          this.displayAddDialog = false;
          this.reloadAllData();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Abonnement ajouté avec succès',
          });
        },
        error: (error) => {
          console.error("Erreur lors de l'ajout:", error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de l'ajout de l'abonnement",
          });
        },
      });
  }

  saveSubscription() {
    if (!this.selectedSubscription) return;

    const token = this.auth.getToken();
    const body = {
      name: this.editForm.name,
      amount: this.editForm.amount,
      frequency: this.editForm.frequency,
      startDate: this.editForm.startDate.toISOString(),
      endDate: this.editForm.endDate?.toISOString() || null,
      category: this.editForm.category,
      notes: this.editForm.notes,
    };

    this.http
      .put(
        `${this.apiUrl}/subscriptions/${this.selectedSubscription.id}`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe(() => {
        this.displayEditDialog = false;
        this.reloadAllData();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Abonnement modifié avec succès',
        });
      });
  }

  deleteSubscription(id: string) {
    const token = this.auth.getToken();
    this.http
      .delete(`${this.apiUrl}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe(() => {
        this.reloadAllData();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Abonnement supprimé avec succès',
        });
      });
  }

  private reloadAllData() {
    this.loadSubscriptions();
    this.loadUpcoming();
    this.loadCalendarEvents();
    this.loadMonthlySummary();
    this.loadStats();
    this.loadAllChartData();
  }

  /**
   * Gestion du changement de thème
   */
  private onThemeChange(event: CustomEvent) {
    const { isDark } = event.detail;
    this.updateChartsTheme(isDark);
  }

  /**
   * Met à jour le thème de tous les graphiques
   */
  private updateChartsTheme(isDark: boolean) {
    const textColor = isDark ? '#e2e8f0' : '#1e293b'; // slate-300 : slate-800
    const backgroundColor = isDark ? '#1e293b' : '#ffffff'; // slate-800 : white
    const axisLineColor = isDark ? '#475569' : '#cbd5e1'; // slate-600 : slate-300
    const splitLineColor = isDark ? '#374151' : '#f1f5f9'; // gray-700 : slate-100

    const commonThemeOptions = {
      textStyle: {
        color: textColor,
      },
      backgroundColor: backgroundColor,
      grid: {
        borderColor: axisLineColor,
      },
    };

    // Mise à jour des couleurs pour chaque graphique
    if (this.radarInstance && Object.keys(this.radarOptions).length) {
      const updatedRadarOptions = {
        ...this.radarOptions,
        ...commonThemeOptions,
        radar: {
          ...((this.radarOptions as any).radar || {}),
          axisName: {
            color: textColor,
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor,
            },
          },
          splitLine: {
            lineStyle: {
              color: splitLineColor,
            },
          },
        },
      };
      this.radarInstance.setOption(updatedRadarOptions, true);
    }

    if (this.pieInstance && Object.keys(this.pieOptions).length) {
      const updatedPieOptions = {
        ...this.pieOptions,
        ...commonThemeOptions,
      };
      this.pieInstance.setOption(updatedPieOptions, true);
    }

    if (this.barInstance && Object.keys(this.barOptions).length) {
      const updatedBarOptions = {
        ...this.barOptions,
        ...commonThemeOptions,
        xAxis: {
          ...((this.barOptions as any).xAxis || {}),
          axisLabel: { color: textColor },
          axisLine: { lineStyle: { color: axisLineColor } },
        },
        yAxis: {
          ...((this.barOptions as any).yAxis || {}),
          axisLabel: { color: textColor },
          axisLine: { lineStyle: { color: axisLineColor } },
          splitLine: { lineStyle: { color: splitLineColor } },
        },
      };
      this.barInstance.setOption(updatedBarOptions, true);
    }

    if (this.lineInstance && Object.keys(this.lineOptions).length) {
      const updatedLineOptions = {
        ...this.lineOptions,
        ...commonThemeOptions,
        xAxis: {
          ...((this.lineOptions as any).xAxis || {}),
          axisLabel: { color: textColor },
          axisLine: { lineStyle: { color: axisLineColor } },
        },
        yAxis: {
          ...((this.lineOptions as any).yAxis || {}),
          axisLabel: { color: textColor },
          axisLine: { lineStyle: { color: axisLineColor } },
          splitLine: { lineStyle: { color: splitLineColor } },
        },
      };
      this.lineInstance.setOption(updatedLineOptions, true);
    }

    if (this.doughnutInstance && Object.keys(this.doughnutOptions).length) {
      const updatedDoughnutOptions = {
        ...this.doughnutOptions,
        ...commonThemeOptions,
      };
      this.doughnutInstance.setOption(updatedDoughnutOptions, true);
    }
  }

  /**
   * Obtient les couleurs de thème sombre pour les graphiques
   */
  private getDarkChartColors() {
    return {
      primary: '#3b82f6', // blue-500
      secondary: '#10b981', // emerald-500
      success: '#059669', // emerald-600
      warning: '#f59e0b', // amber-500
      danger: '#ef4444', // red-500
      info: '#06b6d4', // cyan-500
      text: '#e2e8f0', // slate-300
      background: '#1e293b', // slate-800
      surface: '#334155', // slate-700
      border: '#475569', // slate-600
    };
  }

  /**
   * Obtient les couleurs de thème clair pour les graphiques
   */
  private getLightChartColors() {
    return {
      primary: '#3b82f6', // blue-500
      secondary: '#10b981', // emerald-500
      success: '#059669', // emerald-600
      warning: '#f59e0b', // amber-500
      danger: '#ef4444', // red-500
      info: '#06b6d4', // cyan-500
      text: '#1e293b', // slate-800
      background: '#ffffff', // white
      surface: '#f8fafc', // slate-50
      border: '#cbd5e1', // slate-300
    };
  }

  ngOnDestroy() {
    // Nettoyer les instances ECharts si nécessaire
    this.radarInstance?.dispose();
    this.pieInstance?.dispose();
    this.barInstance?.dispose();
    this.lineInstance?.dispose();
    this.doughnutInstance?.dispose();
  }
}
