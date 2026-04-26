import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'My Indians Store - Admin';
  sidebarOpen = true;
  globalSearch = '';
  currentUrl = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.currentUrl = e.urlAfterRedirects;
      }
    });
  }

  isActive(path: string): boolean {
    return this.currentUrl === path || this.currentUrl.startsWith(path + '/');
  }

  logout(): void {
    this.authService.logout();
    window.location.href = 'http://localhost:4200';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
