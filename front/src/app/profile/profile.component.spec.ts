import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { AuthService, UserProfile } from '../auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const profile: UserProfile = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getProfile',
      'updateProfile',
    ]);
    authService.getProfile.and.returnValue(Promise.resolve(profile));
    authService.updateProfile.and.returnValue(Promise.resolve(profile));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('initializes the form with the loaded profile', () => {
    expect(component.profileForm.controls.name.value).toBe(profile.name);
    expect(component.profile()).toEqual(profile);
  });

  it('updates the avatar preview when a file is selected', () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    } as unknown as FileList;

    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:preview');

    component.onAvatarSelected({
      target: { files: fileList },
    } as unknown as Event);

    expect(component.profileForm.controls.avatar.value).toBe(file);
    expect(component.avatarPreview()).toBe('blob:preview');
  });

  it('sends the form data to the auth service on save', async () => {
    const updatedProfile = { ...profile, name: 'John Doe' };
    const updateSpy = authService.updateProfile.and.returnValue(
      Promise.resolve(updatedProfile)
    );

    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    component.profileForm.controls.name.setValue('John Doe');
    component.profileForm.controls.avatar.setValue(file);

    await component.save();

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const formData = updateSpy.calls.mostRecent().args[0] as FormData;
    expect(formData.get('name')).toBe('John Doe');
    expect(formData.get('avatar')).toBe(file);
  });
});
