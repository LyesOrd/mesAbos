import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import * as echarts from 'echarts';

FullCalendarModule.registerPlugins([dayGridPlugin]);

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
    FullCalendarModule,
    InputNumberModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit {
  message = 'Bonjour !';

  calendarOptions: any = {
    initialView: 'dayGridMonth',
    events: [],
  };

  @ViewChild('radarChart') radarChartRef!: ElementRef;
  radarInstance?: echarts.ECharts;
  radarOptions: echarts.EChartsOption = {};

  categories = [
    { label: 'Streaming', value: 'Streaming' },
    { label: 'Jeux vidéos', value: 'Jeux vidéos' },
    { label: 'Livraisons', value: 'Livraisons' },
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

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    const token = this.auth.getToken();
    this.http
      .get<{ message: string }>('/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((res) => (this.message = res.message));

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
      .get<any[]>('/dashboard/upcoming-payments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((events) => {
        this.calendarOptions = {
          ...this.calendarOptions,
          events: events.map((e) => ({ title: e.name, date: e.date })),
        };
      });
  }

  loadStats() {
    const token = this.auth.getToken();
    this.http
      .get<Record<string, number>>('/dashboard/category-stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe((stats) => {
        const labels = this.categories.map((c) => c.value);
        const data = labels.map((l) => stats[l] || 0);
        const maxVal = Math.max(...data, 1);
        this.radarOptions = {
          legend: { bottom: 0 },
          tooltip: {},
          radar: {
            indicator: labels.map((name) => ({ name, max: maxVal })),
          },
          series: [
            {
              type: 'radar',
              data: [
                {
                  value: data,
                  name: 'Abonnements',
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

  submit() {
    const token = this.auth.getToken();
    const body = { ...this.subscriptionForm };
    this.http
      .post('/subscriptions', body, {
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
        this.loadUpcoming();
        this.loadStats();
      });
  }
}

