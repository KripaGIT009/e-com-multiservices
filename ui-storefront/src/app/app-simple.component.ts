import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppAmazonComponent } from './app-amazon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppAmazonComponent
  ],
  template: `
    <app-amazon></app-amazon>
  `,
  styles: []
})
export class AppComponent {
  title = 'ui-storefront';
}
