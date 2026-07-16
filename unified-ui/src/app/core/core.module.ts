import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { GlobalErrorHandler } from './services/global-error-handler.service';
import { JwtInterceptor } from './interceptors/jwt.interceptor';

/**
 * CoreModule — singleton services and application-wide providers.
 * Imported once in AppModule. Does not declare any components.
 *
 * Providers:
 * - AuthService (explicit, also providedIn: 'root')
 * - NotificationService (explicit, also providedIn: 'root')
 * - GlobalErrorHandler as Angular ErrorHandler
 * - JwtInterceptor as HTTP_INTERCEPTORS
 * - APP_INITIALIZER to restore session on app startup
 *
 * Requirements: 1.6, 8.3
 */
export function initializeApp(authService: AuthService): () => void {
  return () => authService.restoreSession();
}

@NgModule({
  imports: [HttpClientModule],
  providers: [
    AuthService,
    NotificationService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true,
    },
  ],
})
export class CoreModule {}
