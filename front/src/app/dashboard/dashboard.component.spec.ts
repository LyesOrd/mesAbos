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

  it('should load category stats into signal', () => {
    const stats = [
      { category: 'Streaming', count: 3 },
      { category: 'Sport', count: 1 },
    ];
    httpSpy.get.and.returnValue(of(stats));

    component.loadCategoryStats();

    expect(httpSpy.get).toHaveBeenCalledWith(
      'http://localhost:3000/dashboard/category-stats',
      { headers: { Authorization: 'Bearer test-token' } },
    );

    expect(component.categoryStats()).toEqual(stats);
  });

  it('should populate upcoming payments and calendar control', () => {
    const events = [
      { id: '1', name: 'Netflix', date: '2024-01-01T00:00:00.000Z', amount: 9.99 },
    ];
    httpSpy.get.and.returnValue(of(events));

    component.loadUpcoming();

    expect(httpSpy.get).toHaveBeenCalledWith(
      'http://localhost:3000/dashboard/upcoming-payments',
      { headers: { Authorization: 'Bearer test-token' } },
    );

    expect(component.upcomingPayments()).toEqual(events);
    expect(component.calendarControl.value.length).toBe(1);
  });

  it('should load subscriptions list', () => {
    const subs = [
      {
        id: 'sub',
        name: 'Netflix',
        amount: 9.99,
        frequency: 'MONTHLY' as const,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: null,
        category: 'Streaming',
      },
    ];
    httpSpy.get.and.returnValue(of(subs));

    component.loadSubscriptions();

    expect(httpSpy.get).toHaveBeenCalledWith('http://localhost:3000/subscriptions', {
      headers: { Authorization: 'Bearer test-token' },
    });
    expect(component.subscriptions()).toEqual(subs);
  });

  it('should toggle expense dialog visibility', () => {
    component.openExpenseDialog();
    expect(component.expenseDialogOpen()).toBeTrue();
    component.closeExpenseDialog();
    expect(component.expenseDialogOpen()).toBeFalse();
  });

  it('should post expense on submission and refresh upcoming payments', () => {
    const postResponse = of({});
    httpSpy.post.and.returnValue(postResponse);
    spyOn(component, 'closeExpenseDialog');
    spyOn(component, 'loadUpcoming');

    component.handleExpenseSubmit({ name: 'Test', amount: 12, date: new Date('2024-02-01') });

    expect(httpSpy.post).toHaveBeenCalledWith(
      'http://localhost:3000/expenses',
      {
        name: 'Test',
        amount: 12,
        date: new Date('2024-02-01').toISOString(),
      },
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    );
    expect(component.closeExpenseDialog).toHaveBeenCalled();
    expect(component.loadUpcoming).toHaveBeenCalled();
  });
});

