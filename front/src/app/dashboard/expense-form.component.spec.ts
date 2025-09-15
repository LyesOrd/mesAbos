import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseFormComponent } from './expense-form.component';
import { By } from '@angular/platform-browser';

describe('ExpenseFormComponent', () => {
  let component: ExpenseFormComponent;
  let fixture: ComponentFixture<ExpenseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create form with default values', () => {
    expect(component.form.invalid).toBeTrue();
    expect(component.form.value.name).toBe('');
  });

  it('should emit submitted event when form is valid', () => {
    const spy = spyOn(component.submitted, 'emit');
    const date = new Date('2024-01-01');
    component.form.setValue({ name: 'Test', amount: 10, date });
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    expect(spy).toHaveBeenCalledWith({ name: 'Test', amount: 10, date });
  });
});
