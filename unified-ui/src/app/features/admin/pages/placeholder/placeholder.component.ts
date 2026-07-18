import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder-page">
      <h1>{{ title }}</h1>
      <p>This page is coming soon.</p>
    </div>
  `,
  styles: [`
    .placeholder-page {
      padding: 2rem;
      text-align: center;
      h1 { color: #1a1a2e; margin-bottom: 0.5rem; }
      p { color: #6b6b6b; }
    }
  `]
})
export class PlaceholderComponent {
  title = '';

  constructor(private route: ActivatedRoute) {
    this.route.data.subscribe(data => {
      this.title = data['title'] || 'Coming Soon';
    });
  }
}
