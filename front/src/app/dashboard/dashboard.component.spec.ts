import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../auth.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let httpMock: HttpTestingController;

  const authStub = { getToken: () => 'test-token' } as Partial<AuthService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load stats into radar options', () => {
    component.loadStats();
    const req = httpMock.expectOne('http://localhost:3000/dashboard/category-stats');
    req.flush({
      Streaming: 2,
      'Jeux vidéos': 1,
      Livraisons: 3,
      Musique: 4,
      Sport: 2,
      Hobbies: 1,
    });
    const series = (component.radarOptions.series as any[])[0];
    expect(series.type).toBe('radar');
    expect(series.data[0].value).toEqual([2, 1, 3, 4, 2, 1]);
  });

  it('should populate upcoming payments', () => {
    component.loadUpcoming();
    const req = httpMock.expectOne('http://localhost:3000/dashboard/upcoming-payments');
    const events = [{ name: 'Netflix', date: '2024-01-01' }];
    req.flush(events);
    expect(component.upcomingPayments).toEqual(events);
    expect(component.selectedDates.length).toBe(1);
  });
});
