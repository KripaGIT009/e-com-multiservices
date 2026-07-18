import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent {
  categories: string[] = [
    'Electronics',
    'Clothing',
    'Home & Kitchen',
    'Books',
    'Health & Beauty',
    'Sports & Outdoors',
    'Toys & Games',
    'Food & Grocery',
    'Jewelry',
    'Automotive',
  ];
}
