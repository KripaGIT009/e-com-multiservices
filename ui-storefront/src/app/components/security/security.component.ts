import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSlideToggleModule],
  template: `
    <div class="page-container">
      <h1><mat-icon>security</mat-icon> Security Settings</h1>
      
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Password & Authentication</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="setting-item">
            <div>
              <div class="setting-title">Change Password</div>
              <div class="setting-desc">Update your password regularly for security</div>
            </div>
            <button mat-raised-button color="primary">
              <mat-icon>lock</mat-icon>
              Change Password
            </button>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-title">Two-Factor Authentication</div>
              <div class="setting-desc">Add an extra layer of security</div>
            </div>
            <mat-slide-toggle></mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Privacy Settings</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="setting-item">
            <div>
              <div class="setting-title">Activity Tracking</div>
              <div class="setting-desc">Allow us to track your activity for better recommendations</div>
            </div>
            <mat-slide-toggle [checked]="true"></mat-slide-toggle>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-title">Email Notifications</div>
              <div class="setting-desc">Receive updates about orders and promotions</div>
            </div>
            <mat-slide-toggle [checked]="true"></mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    h1 { display: flex; align-items: center; gap: 12px; font-size: 32px; margin-bottom: 24px; }
    .settings-card { margin-bottom: 16px; }
    .setting-item { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 16px 0; 
      border-bottom: 1px solid #f0f0f0; 
    }
    .setting-item:last-child { border-bottom: none; }
    .setting-title { font-weight: 600; margin-bottom: 4px; }
    .setting-desc { font-size: 13px; color: #666; }
  `]
})
export class SecurityComponent {}
