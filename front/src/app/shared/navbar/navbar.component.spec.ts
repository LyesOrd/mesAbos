import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'logout']);
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NavbarComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows login button when not authenticated', () => {
    auth.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connexion');
  });

  it('hides login button when authenticated', () => {
    auth.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Connexion');
  });

  it('provides dashboard access through the user menu when authenticated', () => {
    auth.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();
    const dashboardItem = component.userItems.find(
      (item) => item.label === 'Dashboard'
    );
    expect(dashboardItem).toBeTruthy();
    expect(dashboardItem?.routerLink).toBe('/dashboard');
  });
});
