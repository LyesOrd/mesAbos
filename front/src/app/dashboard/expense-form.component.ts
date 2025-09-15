import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { output } from '@angular/core';

interface Expense {
  name: string;
  amount: number;
  date: Date;
}

@Component({
  selector: 'app-expense-form',
  imports: [ReactiveFormsModule, InputTextModule, InputNumberModule, CalendarModule, ButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4">
      <input
        pInputText
        type="text"
        formControlName="name"
        placeholder="Nom de la dépense"
      />
      <p-inputNumber
        formControlName="amount"
        mode="decimal"
        [useGrouping]="false"
        placeholder="Montant"
      ></p-inputNumber>
      <p-calendar formControlName="date" dateFormat="yy-mm-dd"></p-calendar>
      <div class="flex justify-end gap-2">
        <button
          pButton
          type="button"
          label="Annuler"
          class="p-button-text"
          (click)="cancel()"
        ></button>
        <button
          pButton
          type="submit"
          label="Ajouter"
          [disabled]="form.invalid"
        ></button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    name: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: [new Date(), Validators.required],
  });

  submitted = output<Expense>();
  cancelled = output<void>();

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.submitted.emit(this.form.getRawValue() as Expense);
    this.form.reset({ name: '', amount: null, date: new Date() });
  }

  cancel() {
    this.cancelled.emit();
  }
}
