import { QuaggaJSConfigObject } from '@ericblade/quagga2';

/**
 * Supported barcode formats for the scanner.
 * EAN-13, EAN-8, UPC-A, UPC-E, Code 128
 */
export const SUPPORTED_BARCODE_FORMATS = [
  'ean_reader',
  'ean_8_reader',
  'upc_reader',
  'upc_e_reader',
  'code_128_reader',
] as const;

/**
 * Default QuaggaJS configuration for camera-based barcode scanning.
 * The `inputStream.target` must be set to the actual DOM element before initializing.
 */
export const QUAGGA_DEFAULT_CONFIG: QuaggaJSConfigObject = {
  inputStream: {
    type: 'LiveStream',
    constraints: {
      facingMode: 'environment',
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    area: {
      top: '20%',
      right: '10%',
      left: '10%',
      bottom: '20%',
    },
  },
  decoder: {
    readers: [...SUPPORTED_BARCODE_FORMATS],
  },
  locate: true,
  frequency: 10,
};
