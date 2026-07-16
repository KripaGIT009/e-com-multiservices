import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppHeaderComponent } from './components/app-header/app-header.component';
import { AppFooterComponent } from './components/app-footer/app-footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';

@NgModule({
  declarations: [
    AppHeaderComponent,
    AppFooterComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
    NotificationToastComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [
    AppHeaderComponent,
    AppFooterComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
    NotificationToastComponent,
    CommonModule,
    RouterModule,
    FormsModule,
  ],
})
export class SharedModule {}
