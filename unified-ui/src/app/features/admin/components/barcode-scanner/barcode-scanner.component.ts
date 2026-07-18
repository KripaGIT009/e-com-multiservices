import { Component, ElementRef, EventEmitter, HostListener, Input, NgZone, Output, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Quagga from '@ericblade/quagga2';
import { QUAGGA_DEFAULT_CONFIG } from './quagga.config';

/**
 * Barcode scanner component for admin product management.
 * Supports camera-based scanning, hardware barcode scanner input, and manual SKU entry.
 * Provides a collapsible scanner panel with active status indicator.
 * Requirements: 6.1, 6.2, 6.3, 5.4, 1.1, 1.2, 1.6, 5.3, 5.5, 6.4
 */
@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss'],
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  /** Whether the scanner is active and accepting input */
  @Input() isActive: boolean = false;

  /** Emits the scanned or manually entered barcode/SKU value */
  @Output() barcodeScanned = new EventEmitter<string>();

  /** Emits error messages from the scanner (camera denied, detection failure, etc.) */
  @Output() scannerError = new EventEmitter<string>();

  /** Current state of the scanner: idle, active, or error */
  scannerState: 'idle' | 'active' | 'error' = 'idle';

  /** Whether camera permission was denied by the browser */
  cameraPermissionDenied: boolean = false;

  /** Whether no camera device was found */
  noCameraDevice: boolean = false;

  /** Whether the camera is currently streaming */
  cameraActive: boolean = false;

  /** Whether a scan was recently detected (for visual feedback) */
  scanDetected: boolean = false;

  /** Value bound to the manual SKU entry input field */
  manualSkuValue: string = '';

  /** Whether the scanner panel is collapsed */
  isCollapsed: boolean = false;

  /** Reference to the camera video container element */
  @ViewChild('cameraContainer') cameraContainer!: ElementRef<HTMLDivElement>;

  // --- Hardware barcode scanner detection state ---

  /** Maximum time (ms) between keypresses to consider them as hardware scanner input */
  private readonly RAPID_THRESHOLD_MS = 50;

  /** Minimum barcode length to be considered valid */
  private readonly MIN_BARCODE_LENGTH = 3;

  /** Maximum buffer size to prevent unbounded memory usage */
  private readonly MAX_BUFFER_LENGTH = 128;

  /** Buffer accumulating rapid keypress characters from hardware scanner */
  private scanBuffer: string[] = [];

  /** Timestamp of the last keypress event */
  private lastKeypressTime: number = 0;

  /** Whether QuaggaJS is currently initialized */
  private quaggaInitialized: boolean = false;

  /** Timeout reference for scan feedback visual reset */
  private scanFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Audio context for scan beep feedback */
  private audioContext: AudioContext | null = null;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    if (this.isActive) {
      this.scannerState = 'active';
    }
  }

  ngOnDestroy(): void {
    this.deactivateCamera();
    this.resetScanBuffer();
    if (this.scanFeedbackTimeout) {
      clearTimeout(this.scanFeedbackTimeout);
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Listens for keyboard events to detect hardware barcode scanner input.
   * Hardware scanners emit rapid keypress events (< 50ms apart) followed by Enter.
   * Manual typing is distinguished by longer intervals between keypresses.
   * Requirements: 1.3
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isActive) {
      return;
    }

    // Ignore modifier keys, function keys, and other non-character keys
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const currentTime = Date.now();

    if (event.key === 'Enter') {
      if (this.scanBuffer.length >= this.MIN_BARCODE_LENGTH) {
        const scannedValue = this.scanBuffer.join('');
        this.barcodeScanned.emit(scannedValue);
      }
      this.resetScanBuffer();
      return;
    }

    // Only buffer single printable characters
    if (event.key.length !== 1) {
      return;
    }

    // If time since last keypress exceeds threshold, reset buffer (manual typing detected)
    if (this.lastKeypressTime > 0 && (currentTime - this.lastKeypressTime) > this.RAPID_THRESHOLD_MS) {
      this.scanBuffer = [];
    }

    // Add character to buffer, respecting max length
    if (this.scanBuffer.length < this.MAX_BUFFER_LENGTH) {
      this.scanBuffer.push(event.key);
    }

    this.lastKeypressTime = currentTime;
  }

  /** Reset the hardware scanner buffer and timestamp */
  private resetScanBuffer(): void {
    this.scanBuffer = [];
    this.lastKeypressTime = 0;
  }

  /** Toggle the collapsed state of the scanner panel */
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  /**
   * Activate the camera for barcode scanning.
   * Requests camera access, displays live video preview, and initializes QuaggaJS.
   * Requirements: 1.1, 1.2, 1.6, 5.3
   */
  async activateCamera(): Promise<void> {
    // Reset previous error states
    this.cameraPermissionDenied = false;
    this.noCameraDevice = false;

    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.noCameraDevice = true;
      this.scannerState = 'error';
      this.scannerError.emit('Camera API not supported in this browser.');
      return;
    }

    try {
      // Request camera access to validate permissions before QuaggaJS init
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      // Stop the stream immediately — QuaggaJS will handle its own stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      this.handleCameraError(error);
      return;
    }

    // Initialize QuaggaJS with the camera container element
    this.initQuagga();
  }

  /**
   * Initialize QuaggaJS with the configured settings.
   * Sets up barcode detection callback.
   */
  private initQuagga(): void {
    if (!this.cameraContainer?.nativeElement) {
      this.scannerState = 'error';
      this.scannerError.emit('Camera container not available.');
      return;
    }

    const config = {
      ...QUAGGA_DEFAULT_CONFIG,
      inputStream: {
        ...QUAGGA_DEFAULT_CONFIG.inputStream,
        target: this.cameraContainer.nativeElement,
      },
    };

    Quagga.init(config, (err: any) => {
      this.ngZone.run(() => {
        if (err) {
          this.handleQuaggaInitError(err);
          return;
        }

        this.quaggaInitialized = true;
        this.cameraActive = true;
        this.scannerState = 'active';

        Quagga.start();

        // Register barcode detection handler
        Quagga.onDetected(this.onBarcodeDetected.bind(this));
      });
    });
  }

  /**
   * Handle barcode detection from QuaggaJS.
   * Emits barcodeScanned event and provides visual/audio feedback.
   * Requirements: 1.2, 5.5
   */
  private onBarcodeDetected(result: any): void {
    this.ngZone.run(() => {
      if (!result?.codeResult?.code) {
        return;
      }

      const barcodeValue = result.codeResult.code;

      // Emit the scanned barcode value
      this.barcodeScanned.emit(barcodeValue);

      // Provide visual feedback
      this.showScanFeedback();

      // Provide audio feedback
      this.playScanBeep();
    });
  }

  /**
   * Deactivate the camera and release all resources.
   * Stops QuaggaJS, releases camera stream.
   * Requirements: 5.3, 6.4
   */
  deactivateCamera(): void {
    if (this.quaggaInitialized) {
      Quagga.offDetected(this.onBarcodeDetected.bind(this));
      Quagga.stop();
      this.quaggaInitialized = false;
    }

    this.cameraActive = false;
    this.scannerState = 'idle';
    this.scanDetected = false;
  }

  /**
   * Handle camera access errors.
   * Distinguishes between permission denied and no device found.
   * Requirements: 1.6
   */
  private handleCameraError(error: any): void {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      this.cameraPermissionDenied = true;
      this.scannerState = 'error';
      this.scannerError.emit('Camera access denied. Use manual entry or a hardware scanner.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      this.noCameraDevice = true;
      this.scannerState = 'error';
      this.scannerError.emit('No camera found. Use manual entry or a hardware scanner.');
    } else {
      this.scannerState = 'error';
      this.scannerError.emit('Camera scanner unavailable. Use manual entry.');
    }
  }

  /**
   * Handle QuaggaJS initialization errors.
   * Falls back gracefully to manual mode.
   */
  private handleQuaggaInitError(err: any): void {
    console.error('QuaggaJS initialization failed:', err);

    // Check if it's a camera-related error
    if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
      this.cameraPermissionDenied = true;
    } else if (err.name === 'NotFoundError' || err.message?.includes('not found')) {
      this.noCameraDevice = true;
    }

    this.scannerState = 'error';
    this.scannerError.emit('Camera scanner unavailable. Use manual entry.');
  }

  /**
   * Show visual feedback when a barcode is successfully detected.
   * Briefly highlights the camera area.
   * Requirements: 5.5
   */
  private showScanFeedback(): void {
    this.scanDetected = true;

    if (this.scanFeedbackTimeout) {
      clearTimeout(this.scanFeedbackTimeout);
    }

    this.scanFeedbackTimeout = setTimeout(() => {
      this.scanDetected = false;
      this.scanFeedbackTimeout = null;
    }, 800);
  }

  /**
   * Play a brief beep sound when a barcode is detected.
   * Uses Web Audio API for minimal overhead.
   * Requirements: 5.5
   */
  private playScanBeep(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch {
      // Audio feedback is optional — silently ignore if unavailable
    }
  }

  /** Submit the manually entered SKU value */
  onManualSubmit(): void {
    const value = this.manualSkuValue.trim();
    if (value) {
      this.barcodeScanned.emit(value);
      this.manualSkuValue = '';
    }
  }
}
