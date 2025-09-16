import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
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
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [ConfirmationService, MessageService],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  message = 'Bonjour !';

  @ViewChild('radarChart') radarChartRef!: ElementRef;
  radarInstance?: echarts.ECharts;
  radarOptions: echarts.EChartsOption = {};
  upcomingPayments: { name: string; date: string }[] = [];
  selectedDates: Date[] = [];
  subscriptions: Subscription[] = [];
  selectedSubscription: Subscription | null = null;
  displayEditDialog = false;
  displayAddDialog = false;
  displayDeleteDialog = false;

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
  ) {}

  ngOnInit() {
    const token = this.auth.getToken();
    this.http
      .get<{ message: string }>(`${this.apiUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((res) => (this.message = res.message));

    this.loadSubscriptions();
    this.loadUpcoming();
    this.loadStats();
  }

  ngAfterViewInit() {
    this.radarInstance = echarts.init(this.radarChartRef.nativeElement);
    if (Object.keys(this.radarOptions).length) {
      this.radarInstance.setOption(this.radarOptions);
    }
  }

  loadUpcoming() {
    const token = this.auth.getToken();
    this.http
      .get<{ name: string; date: string }[]>(
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

  loadStats() {
    const token = this.auth.getToken();
    this.http
      .get<Record<string, number>>(`${this.apiUrl}/dashboard/category-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((stats) => {
        const labels = this.categories.map((c) => c.value);
        const data = labels.map((l) => stats[l] || 0);
        const maxVal = Math.max(...data, 1);
        this.radarOptions = {
          title: { text: 'Répartition des abonnements' },
          legend: { data: ['Subscriptions'] },
          tooltip: {},
          radar: {
            indicator: labels.map((name) => ({ name, max: maxVal })),
          },
          series: [
            {
              name: 'Streaming',
              type: 'radar',
              data: [
                {
                  value: data,
                  name: 'Streaming',
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
        this.loadSubscriptions();
        this.loadUpcoming();
        this.loadStats();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Abonnement modifié avec succès',
        });
      });
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

  deleteSubscription(id: string) {
    const token = this.auth.getToken();
    this.http
      .delete(`${this.apiUrl}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe(() => {
        this.loadSubscriptions();
        this.loadUpcoming();
        this.loadStats();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Abonnement supprimé avec succès',
        });
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
          this.loadSubscriptions();
          this.loadUpcoming();
          this.loadStats();
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
}
