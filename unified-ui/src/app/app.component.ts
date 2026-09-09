import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { AuthUser } from './core/models/auth.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  currentUser$: Observable<AuthUser | null>;
  showStorefrontShell = true;

  /**
   * Sections that bring their own chrome. The shopper header, category nav, cart and
   * footer are suppressed inside them.
   */
  private static readonly OWN_SHELL = ['/admin', '/seller'];

  private routerSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.showStorefrontShell = !AppComponent.OWN_SHELL.some(
          (prefix) => url === prefix || url.startsWith(prefix + '/')
        );
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
