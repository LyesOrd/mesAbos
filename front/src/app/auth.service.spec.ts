import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
  });

  it('removes token on logout', () => {
    localStorage.setItem('token', 'test');
    service.logout();
    expect(service.getToken()).toBeNull();
  });

  it('detects expired token', () => {
    const payload = btoa(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 })
    );
    const token = `header.${payload}.sig`;
    localStorage.setItem('token', token);
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });
});
