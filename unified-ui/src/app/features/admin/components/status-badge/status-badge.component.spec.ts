import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent, StatusVariant } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display the provided text', () => {
    component.text = 'Active';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(el.textContent?.trim()).toBe('Active');
  });

  it('should apply the correct BEM variant class', () => {
    component.variant = 'pending';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(el.classList.contains('status-badge--pending')).toBeTrue();
  });

  it('should apply default variant class when no variant is set', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(el.classList.contains('status-badge--default')).toBeTrue();
  });

  it('should include aria-label with label and text for accessibility', () => {
    component.text = 'Shipped';
    component.label = 'Order';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(el.getAttribute('aria-label')).toBe('Order status: Shipped');
  });

  it('should use "Item" as the default label in aria-label', () => {
    component.text = 'Active';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(el.getAttribute('aria-label')).toBe('Item status: Active');
  });

  describe('variant CSS class mapping', () => {
    const variants: StatusVariant[] = [
      'active', 'inactive', 'in-stock', 'low-stock', 'out-of-stock',
      'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'default',
    ];

    variants.forEach((variant) => {
      it(`should apply class "status-badge--${variant}" for variant "${variant}"`, () => {
        component.variant = variant;
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
        expect(el.classList.contains(`status-badge--${variant}`)).toBeTrue();
      });
    });
  });
});
