import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  const authStub: Partial<AuthService> = {
    getToken: () => 'test-token',
  };

  beforeEach(async () => {
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: HttpClient, useValue: httpSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should load stats into radar options', () => {
    const stats = {
      Streaming: 2,
      'Jeux vidéos': 1,
      Livraisons: 3,
      Musique: 4,
      Sport: 2,
      Hobbies: 1,
    };
    httpSpy.get.and.returnValue(of(stats));

    component.loadStats();

    expect(httpSpy.get).toHaveBeenCalledWith(
      'http://localhost:3000/dashboard/category-stats',
      { headers: { Authorization: 'Bearer test-token' } },
    );

    const series = (component.radarOptions.series as any[])[0];
    expect(series.type).toBe('radar');
    expect(series.data[0].value).toEqual([2, 1, 3, 4, 2, 1]);
  });

  it('should populate upcoming payments', () => {
    const events = [{ name: 'Netflix', date: '2024-01-01' }];
    httpSpy.get.and.returnValue(of(events));

    component.loadUpcoming();

    expect(httpSpy.get).toHaveBeenCalledWith(
      'http://localhost:3000/dashboard/upcoming-payments',
      { headers: { Authorization: 'Bearer test-token' } },
    );

    expect(component.upcomingPayments).toEqual(events);
    expect(component.selectedDates.length).toBe(1);
  });

  it('should toggle expense dialog visibility', () => {
    component.openExpenseDialog();
    expect(component.expenseDialogOpen()).toBeTrue();
    component.closeExpenseDialog();
    expect(component.expenseDialogOpen()).toBeFalse();
  });
});

