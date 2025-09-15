import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService, UserProfile } from '../auth.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';

type ProfileFormGroup = FormGroup<{
  name: FormControl<string>;
  avatar: FormControl<File | null>;
}>;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    InputTextModule,
    ButtonModule,
    NgOptimizedImage,
  ],
  host: {
    class:
      'block min-h-screen bg-gradient-to-b from-primary-50 to-surface-0 dark:from-surface-900 dark:to-surface-900',
  },
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profileForm: ProfileFormGroup = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    avatar: new FormControl<File | null>(null),
  });

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly avatarPreview = signal<string | null>(null);

  private previewObjectUrl: string | null = null;

  readonly displayAvatar = computed(() =>
    this.avatarPreview() ?? this.profile()?.avatarUrl ?? null
  );

  readonly disableSubmit = computed(
    () => this.profileForm.invalid || this.saving() || this.loading()
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.revokePreviewUrl());
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  async save() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const nameValue = this.profileForm.controls.name.value.trim();
    if (!nameValue) {
      this.profileForm.controls.name.setErrors({ required: true });
      this.profileForm.controls.name.markAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('name', nameValue);
    const avatarFile = this.profileForm.controls.avatar.value;
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const updatedProfile = await this.auth.updateProfile(formData);
      this.profile.set(updatedProfile);
      this.profileForm.controls.name.setValue(updatedProfile.name ?? '');
      this.profileForm.controls.avatar.setValue(null);
      this.setAvatarPreview(null);
      this.successMessage.set('Profil mis à jour avec succès.');
    } catch {
      this.errorMessage.set('La mise à jour du profil a échoué.');
    } finally {
      this.saving.set(false);
    }
  }

  async loadProfile() {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const profile = await this.auth.getProfile();
      this.profile.set(profile);
      this.profileForm.patchValue({
        name: profile.name ?? '',
        avatar: null,
      });
    } catch {
      this.errorMessage.set("Impossible de charger votre profil.");
    } finally {
      this.loading.set(false);
    }
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.profileForm.controls.avatar.setValue(file);

    if (!file) {
      this.setAvatarPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    this.setAvatarPreview(objectUrl);
  }

  private setAvatarPreview(url: string | null) {
    this.revokePreviewUrl();

    if (url) {
      this.previewObjectUrl = url;
    } else {
      this.previewObjectUrl = null;
    }

    this.avatarPreview.set(url);
  }

  private revokePreviewUrl() {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }
}
