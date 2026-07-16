import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { AuthUser } from './core/models/auth.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  currentUser$: Observable<AuthUser | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }
}
