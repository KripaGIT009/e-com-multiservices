import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTopBarComponent } from './admin-top-bar.component';

describe('AdminTopBarComponent', () => {
  let component: AdminTopBarComponent;
  let fixture: ComponentFixture<AdminTopBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTopBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the store name', () => {
    component.storeName = 'MyIndianStore';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.admin-top-bar__store-name')?.textContent?.trim()).toBe('MyIndianStore');
  });

  it('should display the user name', () => {
    component.userName = 'Admin User';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.admin-top-bar__profile-name')?.textContent?.trim()).toBe('Admin User');
  });

  it('should emit sidebarToggle when hamburger is clicked', () => {
    spyOn(component.sidebarToggle, 'emit');
    const btn = fixture.nativeElement.querySelector('.admin-top-bar__hamburger') as HTMLButtonElement;
    btn.click();
    expect(component.sidebarToggle.emit).toHaveBeenCalled();
  });

  it('should toggle profileDropdownOpen on profile click', () => {
    expect(component.profileDropdownOpen).toBeFalse();
    const profileEl = fixture.nativeElement.querySelector('.admin-top-bar__profile') as HTMLElement;
    profileEl.click();
    expect(component.profileDropdownOpen).toBeTrue();
    profileEl.click();
    expect(component.profileDropdownOpen).toBeFalse();
  });

  it('should emit logoutClicked when logout button is clicked', () => {
    spyOn(component.logoutClicked, 'emit');
    component.profileDropdownOpen = true;
    fixture.detectChanges();
    const logoutBtn = fixture.nativeElement.querySelector('.admin-top-bar__dropdown-item') as HTMLButtonElement;
    logoutBtn.click();
    expect(component.logoutClicked.emit).toHaveBeenCalled();
  });

  it('should close dropdown after logout is clicked', () => {
    component.profileDropdownOpen = true;
    fixture.detectChanges();
    component.onLogout();
    expect(component.profileDropdownOpen).toBeFalse();
  });

  it('should show notification badge when count > 0', () => {
    component.notificationCount = 5;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.admin-top-bar__notification-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('5');
  });

  it('should not show notification badge when count is 0', () => {
    component.notificationCount = 0;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.admin-top-bar__notification-badge');
    expect(badge).toBeNull();
  });
});
