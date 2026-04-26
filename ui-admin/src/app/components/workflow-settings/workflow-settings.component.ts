import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkflowSettingsService } from '../../services/workflow-settings.service';

@Component({
  selector: 'app-workflow-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Order Workflow Priority Settings</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <p class="hint">Higher value means higher recommendation priority.</p>

          <table mat-table [dataSource]="rows" class="full-width mat-elevation-z2">
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef>Action</th>
              <td mat-cell *matCellDef="let row">{{ row.action }}</td>
            </ng-container>

            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let row">
                <mat-form-field appearance="outline" class="priority-field">
                  <input matInput type="number" min="0" [(ngModel)]="row.priority">
                </mat-form-field>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div class="actions">
            <button mat-stroked-button color="primary" (click)="load()">
              <mat-icon>refresh</mat-icon>
              Reload
            </button>
            <button mat-raised-button color="primary" (click)="save()">
              <mat-icon>save</mat-icon>
              Save Priorities
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }

    .full-width {
      width: 100%;
    }

    .hint {
      color: #6b7280;
      margin-bottom: 12px;
    }

    .priority-field {
      width: 140px;
    }

    .actions {
      margin-top: 16px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  `]
})
export class WorkflowSettingsComponent implements OnInit {
  displayedColumns = ['action', 'priority'];
  rows: Array<{ action: string; priority: number }> = [];

  constructor(
    private workflowSettingsService: WorkflowSettingsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.workflowSettingsService.getOrderWorkflowPriorities().subscribe({
      next: (data) => {
        const priorities = data?.actionPriorities ?? {};
        this.rows = Object.keys(priorities)
          .sort((a, b) => priorities[b] - priorities[a])
          .map((action) => ({ action, priority: priorities[action] }));
      },
      error: () => {
        this.snackBar.open('Failed to load workflow priorities', 'Close', { duration: 3000 });
      }
    });
  }

  save(): void {
    const invalid = this.rows.some(row => row.priority == null || row.priority < 0);
    if (invalid) {
      this.snackBar.open('Priority must be a non-negative number', 'Close', { duration: 3000 });
      return;
    }

    const actionPriorities: Record<string, number> = {};
    this.rows.forEach(row => {
      actionPriorities[row.action] = Number(row.priority);
    });

    this.workflowSettingsService.updateOrderWorkflowPriorities(actionPriorities).subscribe({
      next: () => {
        this.snackBar.open('Workflow priorities updated', 'Close', { duration: 2500 });
        this.load();
      },
      error: (error) => {
        const message = error?.error?.error || 'Failed to update workflow priorities';
        this.snackBar.open(message, 'Close', { duration: 3500 });
      }
    });
  }
}
