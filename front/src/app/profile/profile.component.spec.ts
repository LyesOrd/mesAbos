import { TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { ProfileService, UserProfile } from './profile.service';

describe('ProfileComponent', () => {
  let service: jasmine.SpyObj<ProfileService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('ProfileService', ['getProfile', 'updateProfile']);
    const profile: UserProfile = { id: '1', name: 'John' };
    service.getProfile.and.returnValue(Promise.resolve(profile));
    service.updateProfile.and.returnValue(Promise.resolve(profile));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: ProfileService, useValue: service }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should update profile on save', async () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.form.setValue({ name: 'Jane' });
    await component.save();
    expect(service.updateProfile).toHaveBeenCalledWith({
      name: 'Jane',
      avatarUrl: undefined,
    });
  });
});
