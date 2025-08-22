import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['register', 'isLoggedIn', 'logout']);
    authSpy.isLoggedIn.and.returnValue(false);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should call auth.register on submit when passwords match', async () => {
    component.name = 'Test';
    component.email = 'test@example.com';
    component.password = 'abcdef';
    component.confirm = 'abcdef';
    authSpy.register.and.resolveTo({});
    await component.submit();
    expect(authSpy.register).toHaveBeenCalledWith('Test', 'test@example.com', 'abcdef');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set error when passwords do not match', async () => {
    component.password = 'abc';
    component.confirm = 'xyz';
    await component.submit();
    expect(component.error).toBe('Les mots de passe ne correspondent pas');
    expect(authSpy.register).not.toHaveBeenCalled();
  });
});
