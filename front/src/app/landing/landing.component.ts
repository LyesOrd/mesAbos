import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../shared/navbar/navbar.component';
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [ButtonModule, NavbarComponent, NavbarComponent, InputTextModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
  public currentYear: number = new Date().getFullYear();
  constructor() {}

  ngOnInit(): void {}
}
