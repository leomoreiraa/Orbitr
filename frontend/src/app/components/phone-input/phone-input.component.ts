import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  format: string;
  placeholder: string;
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative flex">
      <!-- Country Selector -->
      <div class="relative">
        <button type="button" 
          (click)="toggleDropdown()"
          class="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/70 border border-r-0 border-neutral-300 dark:border-neutral-600 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition">
          <span class="text-lg">{{ selectedCountry.code }}</span>
          <span class="text-xs text-neutral-600 dark:text-neutral-400">{{ selectedCountry.dialCode }}</span>
          <svg class="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <!-- Dropdown -->
        <div *ngIf="showDropdown" 
          class="absolute top-full left-0 z-50 w-72 max-h-60 overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-lg mt-1">
          <div *ngFor="let country of countries" 
            (click)="selectCountry(country)"
            class="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer text-sm">
            <span class="text-lg">{{ country.code }}</span>
            <span class="text-xs text-neutral-600 dark:text-neutral-400 min-w-[3rem]">{{ country.dialCode }}</span>
            <span class="text-neutral-800 dark:text-neutral-200 flex-1">{{ country.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- Phone Input -->
      <input 
        type="tel"
        [value]="formattedPhone"
        (input)="onPhoneInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        [placeholder]="selectedCountry.placeholder"
        [class]="inputClasses"
        class="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-300 dark:border-neutral-600 rounded-r-md text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition">
    </div>
    
    <!-- Click overlay to close dropdown -->
    <div *ngIf="showDropdown" 
      (click)="closeDropdown()"
      class="fixed inset-0 z-40"></div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PhoneInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() inputClasses = '';
  
  showDropdown = false;
  formattedPhone = '';
  rawPhone = '';
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  countries: Country[] = [
    { code: '🇧🇷', name: 'Brasil', dialCode: '+55', format: '(XX) XXXXX-XXXX', placeholder: '(11) 99999-9999' },
    { code: '🇺🇸', name: 'Estados Unidos', dialCode: '+1', format: '(XXX) XXX-XXXX', placeholder: '(555) 123-4567' },
    { code: '🇨🇦', name: 'Canadá', dialCode: '+1', format: '(XXX) XXX-XXXX', placeholder: '(555) 123-4567' },
    { code: '🇦🇷', name: 'Argentina', dialCode: '+54', format: 'XX XXXX-XXXX', placeholder: '11 1234-5678' },
    { code: '🇨🇱', name: 'Chile', dialCode: '+56', format: 'X XXXX XXXX', placeholder: '9 1234 5678' },
    { code: '🇨🇴', name: 'Colômbia', dialCode: '+57', format: 'XXX XXX XXXX', placeholder: '300 123 4567' },
    { code: '🇵🇪', name: 'Peru', dialCode: '+51', format: 'XXX XXX XXX', placeholder: '987 654 321' },
    { code: '🇺🇾', name: 'Uruguai', dialCode: '+598', format: 'X XXX XXXX', placeholder: '9 123 4567' },
    { code: '🇵🇾', name: 'Paraguai', dialCode: '+595', format: 'XXX XXX XXX', placeholder: '971 123 456' },
    { code: '🇧🇴', name: 'Bolívia', dialCode: '+591', format: 'XXXX XXXX', placeholder: '7123 4567' },
    { code: '🇪🇨', name: 'Equador', dialCode: '+593', format: 'XX XXX XXXX', placeholder: '99 123 4567' },
    { code: '🇻🇪', name: 'Venezuela', dialCode: '+58', format: 'XXX-XXX-XXXX', placeholder: '414-123-4567' },
    { code: '🇬🇧', name: 'Reino Unido', dialCode: '+44', format: 'XXXX XXX XXXX', placeholder: '7700 900123' },
    { code: '🇩🇪', name: 'Alemanha', dialCode: '+49', format: 'XXX XXXXXXXX', placeholder: '151 12345678' },
    { code: '🇫🇷', name: 'França', dialCode: '+33', format: 'X XX XX XX XX', placeholder: '6 12 34 56 78' },
    { code: '🇪🇸', name: 'Espanha', dialCode: '+34', format: 'XXX XX XX XX', placeholder: '612 34 56 78' },
    { code: '🇮🇹', name: 'Itália', dialCode: '+39', format: 'XXX XXX XXXX', placeholder: '123 456 7890' },
    { code: '🇵🇹', name: 'Portugal', dialCode: '+351', format: 'XXX XXX XXX', placeholder: '912 345 678' },
    { code: '🇯🇵', name: 'Japão', dialCode: '+81', format: 'XX-XXXX-XXXX', placeholder: '90-1234-5678' },
    { code: '🇨🇳', name: 'China', dialCode: '+86', format: 'XXX XXXX XXXX', placeholder: '138 0013 8000' },
    { code: '🇮🇳', name: 'Índia', dialCode: '+91', format: 'XXXXX XXXXX', placeholder: '98765 43210' },
    { code: '🇦🇺', name: 'Austrália', dialCode: '+61', format: 'XXX XXX XXX', placeholder: '412 345 678' },
    { code: '🇲🇽', name: 'México', dialCode: '+52', format: 'XX XXXX XXXX', placeholder: '55 1234 5678' }
  ];

  selectedCountry: Country = this.countries[0];

  ngOnInit() {
    // Set Brazil as default
    this.selectedCountry = this.countries.find(c => c.dialCode === '+55') || this.countries[0];
  }

  ngOnDestroy() {
    // Clean up event listeners
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  selectCountry(country: Country) {
    this.selectedCountry = country;
    this.showDropdown = false;
    this.formatAndEmit();
  }

  onPhoneInput(event: any) {
    const input = event.target.value;
    // Remove all non-digits
    this.rawPhone = input.replace(/\D/g, '');
    this.formatPhone();
    this.formatAndEmit();
  }

  formatPhone() {
    if (!this.rawPhone) {
      this.formattedPhone = '';
      return;
    }

    const format = this.selectedCountry.format;
    let formatted = '';
    let phoneIndex = 0;

    for (let i = 0; i < format.length && phoneIndex < this.rawPhone.length; i++) {
      if (format[i] === 'X') {
        formatted += this.rawPhone[phoneIndex];
        phoneIndex++;
      } else {
        formatted += format[i];
      }
    }

    this.formattedPhone = formatted;
  }

  formatAndEmit() {
    this.formatPhone();
    const fullNumber = this.rawPhone ? `${this.selectedCountry.dialCode}${this.rawPhone}` : '';
    this.onChange(fullNumber);
  }

  onFocus() {
    // Optional: Add focus behavior
  }

  onBlur() {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (value) {
      // Try to parse the international number
      for (const country of this.countries) {
        if (value.startsWith(country.dialCode)) {
          this.selectedCountry = country;
          this.rawPhone = value.substring(country.dialCode.length);
          this.formatPhone();
          break;
        }
      }
    } else {
      this.rawPhone = '';
      this.formattedPhone = '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}