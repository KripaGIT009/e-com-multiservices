import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';

interface Order {
  id: string;
  status: string;
  items: { productName: string; quantity: number }[];
}

@Component({
  selector: 'app-return-request',
  templateUrl: './return-request.component.html',
  styleUrls: ['./return-request.component.scss'],
})
export class ReturnRequestComponent implements OnInit {
  returnForm: FormGroup;
  orders: Order[] = [];
  isLoading = true;
  isSubmitting = false;
  submitted = false;

  reasons = [
    'Defective/Damaged Product',
    'Wrong Item Received',
    'Product Not as Described',
    'Size/Fit Issue',
    'Changed My Mind',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.returnForm = this.fb.group({
      orderId: ['', [Validators.required]],
      reason: ['', [Validators.required]],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.http.get<Order[]>('/api/orders').subscribe({
      next: (orders) => {
        this.orders = orders.filter(
          (o) => o.status?.toUpperCase() === 'DELIVERED' || o.status?.toUpperCase() === 'COMPLETED'
        );
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Failed to load orders.', 'error');
      },
    });
  }

  onSubmit(): void {
    if (this.returnForm.invalid) {
      this.returnForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.http.post('/api/returns', this.returnForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitted = true;
        this.notificationService.show('Return request submitted successfully!', 'success');
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.show('Failed to submit return request.', 'error');
      },
    });
  }
}
