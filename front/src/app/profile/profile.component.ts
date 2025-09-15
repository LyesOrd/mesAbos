import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  template: `
    <h2>Profile</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
      <label class="flex flex-col">
        <span>Name</span>
        <input class="border p-2" type="text" formControlName="name" />
      </label>

      <label class="flex flex-col">
        <span>Profile picture</span>
        <input type="file" accept="image/*" (change)="onFileChange($event)" />
      </label>

      @if (avatarPreview()) {
        <img [ngSrc]="avatarPreview()!" width="100" height="100" alt="avatar preview" />
      }

      <button class="p-button" type="submit" [disabled]="form.invalid || saving()">Save</button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);

  readonly avatarPreview = signal<string | undefined>(undefined);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    this.load();
  }

  async load() {
    const profile = await this.profileService.getProfile();
    this.form.patchValue({ name: profile.name });
    this.avatarPreview.set(profile.avatarUrl);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  async save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      await this.profileService.updateProfile({
        name: this.form.value.name!,
        avatarUrl: this.avatarPreview(),
      });
    } finally {
      this.saving.set(false);
    }
  }
}
