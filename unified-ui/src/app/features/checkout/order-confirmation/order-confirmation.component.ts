import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss'],
})
export class OrderConfirmationComponent implements OnInit {
  orderId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
  }

  continueShopping(): void {
    this.router.navigate(['/storefront/products']);
  }

  viewOrders(): void {
    this.router.navigate(['/account/orders']);
  }
}
