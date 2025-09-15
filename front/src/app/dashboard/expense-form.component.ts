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
      <input pInputText type="text" formControlName="name" placeholder="Nom" />
      <p-inputNumber formControlName="amount" mode="decimal" [useGrouping]="false" placeholder="Montant"></p-inputNumber>
      <p-calendar formControlName="date" dateFormat="yy-mm-dd"></p-calendar>
      <button pButton type="submit" label="Ajouter" [disabled]="form.invalid"></button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    name: ['', Validators.required],
    amount: [0, Validators.required],
    date: [new Date(), Validators.required],
  });

  submitted = output<Expense>();

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.submitted.emit(this.form.getRawValue() as Expense);
  }
}
