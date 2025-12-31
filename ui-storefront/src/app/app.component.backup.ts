import { Component } from '@angular/core';
import { AppAmazonComponent } from './app-amazon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppAmazonComponent],
  template: `<router-outlet/>`,
  styles: []
})
export class AppComponent {
  title = 'ui-storefront';
}
