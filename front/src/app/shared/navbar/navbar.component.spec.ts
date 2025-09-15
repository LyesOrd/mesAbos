import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService, UserProfile } from '../../auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'logout',
      'getProfile',
    ]);
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NavbarComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    auth.getProfile.and.returnValue(of<UserProfile | null>(null));
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows login button when not authenticated', () => {
    auth.isLoggedIn.and.returnValue(false);
    auth.getProfile.and.returnValue(of<UserProfile | null>(null));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connexion');
  });

  it('hides login button when authenticated', () => {
    auth.isLoggedIn.and.returnValue(true);
    auth.getProfile.and.returnValue(of<UserProfile | null>(null));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Connexion');
  });

  it('provides dashboard and profile access through the user menu when authenticated', () => {
    auth.isLoggedIn.and.returnValue(true);
    auth.getProfile.and.returnValue(
      of({
        id: '1',
        email: 'john@example.com',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.png',
      })
    );
    fixture.detectChanges();
    const profileItem = component.userItems.find(
      (item) => item.label === 'Profil'
    );
    expect(profileItem).toBeTruthy();
    expect(profileItem?.routerLink).toBe('/profile');
  });

  it('renders the avatar linking to the profile when authenticated', fakeAsync(() => {
    auth.isLoggedIn.and.returnValue(true);
    const profile: UserProfile = {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar.png',
    };
    auth.getProfile.and.returnValue(of(profile));

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const avatarLink: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a[routerlink="/profile"]');
    expect(avatarLink).withContext('profile link should exist').not.toBeNull();
    expect(avatarLink?.getAttribute('href')).toContain('/profile');

    const avatarImage = avatarLink?.querySelector('img');
    expect(avatarImage)
      .withContext('avatar image should render')
      .not.toBeNull();
    expect(avatarImage?.getAttribute('ng-reflect-ng-src')).toBe(
      profile.avatarUrl
    );
    expect(avatarImage?.getAttribute('alt')).toContain(profile.name);
  }));
});
