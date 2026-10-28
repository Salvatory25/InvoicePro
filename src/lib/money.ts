/**
 * InvoicePro — Decimal-Safe Financial Arithmetic Engine
 *
 * All monetary amounts are represented and calculated using exact integer
 * minor units (BigInt scaled by 100 for 2-decimal currencies, with 10^6
 * intermediate scaling for quantities and tax rates). Floating-point math
 * is NEVER used as the source of truth for financial totals.
 */

export type CurrencyCode = 'TZS' | 'KES' | 'UGX' | 'USD' | 'EUR' | 'GBP' | 'RWF';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  nameEn: string;
  nameSw: string;
  minorDigits: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  TZS: { code: 'TZS', symbol: 'TSh', nameEn: 'Tanzanian Shilling', nameSw: 'Shilingi ya Tanzania', minorDigits: 2 },
  KES: { code: 'KES', symbol: 'KSh', nameEn: 'Kenyan Shilling', nameSw: 'Shilingi ya Kenya', minorDigits: 2 },
  UGX: { code: 'UGX', symbol: 'USh', nameEn: 'Ugandan Shilling', nameSw: 'Shilingi ya Uganda', minorDigits: 2 },
  RWF: { code: 'RWF', symbol: 'FRw', nameEn: 'Rwandan Franc', nameSw: 'Faranga ya Rwanda', minorDigits: 2 },
  USD: { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameSw: 'Dola ya Marekani', minorDigits: 2 },
  EUR: { code: 'EUR', symbol: '€', nameEn: 'Euro', nameSw: 'Yuro', minorDigits: 2 },
  GBP: { code: 'GBP', symbol: '£', nameEn: 'British Pound', nameSw: 'Pauni ya Uingereza', minorDigits: 2 },
};

export interface LineItemCalculationInput {
  quantity: string | number;
  unitPrice: string | number;
  discountAmount?: string | number;
  taxRatePercent?: string | number;
}

export interface LineItemCalculated {
  lineSubtotalMinor: bigint;
  discountMinor: bigint;
  taxableMinor: bigint;
  taxAmountMinor: bigint;
  lineTotalMinor: bigint;
  lineSubtotal: string;
  discountAmount: string;
  taxAmount: string;
  lineTotal: string;
}

export interface DocumentTotalsCalculated {
  subtotalMinor: bigint;
  discountTotalMinor: bigint;
  taxTotalMinor: bigint;
  grandTotalMinor: bigint;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  lines: LineItemCalculated[];
}

/**
 * Parse a decimal string or number into exact scaled BigInt without float drift.
 * Scale = 2 means minor units (cents/sene, i.e., * 100).
 */
export function parseDecimalToScaledBigInt(value: string | number, scale = 2): bigint {
  const raw = String(value ?? '0').trim().replace(/,/g, '');
  if (!raw || raw === '-') return 0n;
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Invalid decimal value: "${value}"`);
  }

  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const [intPart = '0', fracPart = ''] = unsigned.split('.');

  const paddedFrac = (fracPart + '0'.repeat(scale + 1)).slice(0, scale + 1);
  const mainFrac = paddedFrac.slice(0, scale);
  const roundDigit = Number(paddedFrac[scale] ?? '0');

  let scaled = BigInt(intPart) * 10n ** BigInt(scale) + (mainFrac ? BigInt(mainFrac) : 0n);
  if (roundDigit >= 5) {
    scaled += 1n;
  }

  return isNegative ? -scaled : scaled;
}

/**
 * Convert minor units (scale = 2) back to canonical "0.00" decimal string.
 */
export function minorToDecimalString(minor: bigint): string {
  const isNegative = minor < 0n;
  const abs = isNegative ? -minor : minor;
  const whole = abs / 100n;
  const cents = abs % 100n;
  const formatted = `${whole.toString()}.${cents.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Divide BigInt with deterministic Round Half Up.
 */
function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error('Division by zero in financial calculation');
  const isNegative = (numerator < 0n) !== (denominator < 0n);
  const absNum = numerator < 0n ? -numerator : numerator;
  const absDen = denominator < 0n ? -denominator : denominator;

  const quotient = absNum / absDen;
  const remainder = absNum % absDen;
  const rounded = remainder * 2n >= absDen ? quotient + 1n : quotient;
  return isNegative ? -rounded : rounded;
}

/**
 * Calculate a single invoice/quotation line item using exact integer arithmetic.
 * - quantity scaled by 10,000 (4 decimal places)
 * - unitPrice scaled by 100 (2 decimal places, minor units)
 * - taxRatePercent scaled by 1,000 (3 decimal places, e.g., 18.000%)
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculated {
  const qtyScaled4 = parseDecimalToScaledBigInt(input.quantity, 4);
  const priceMinor = parseDecimalToScaledBigInt(input.unitPrice, 2);
  const discountMinorRaw = parseDecimalToScaledBigInt(input.discountAmount ?? 0, 2);
  const taxRateScaled3 = parseDecimalToScaledBigInt(input.taxRatePercent ?? 0, 3);

  if (qtyScaled4 < 0n) throw new Error('Quantity cannot be negative');
  if (priceMinor < 0n) throw new Error('Unit price cannot be negative');
  if (discountMinorRaw < 0n) throw new Error('Discount cannot be negative');
  if (taxRateScaled3 < 0n || taxRateScaled3 > 100000n) {
    throw new Error('Tax rate must be between 0% and 100%');
  }

  // lineSubtotalMinor = round(qtyScaled4 * priceMinor / 10000)
  const lineSubtotalMinor = divideRoundHalfUp(qtyScaled4 * priceMinor, 10000n);
  if (discountMinorRaw > lineSubtotalMinor) {
    throw new Error('Line discount cannot exceed line subtotal');
  }

  const discountMinor = discountMinorRaw;
  const taxableMinor = lineSubtotalMinor - discountMinor;
  // taxAmountMinor = round(taxableMinor * taxRateScaled3 / 100000) (since 100% = 100,000 in scale 3)
  const taxAmountMinor = divideRoundHalfUp(taxableMinor * taxRateScaled3, 100000n);
  const lineTotalMinor = taxableMinor + taxAmountMinor;

  return {
    lineSubtotalMinor,
    discountMinor,
    taxableMinor,
    taxAmountMinor,
    lineTotalMinor,
    lineSubtotal: minorToDecimalString(lineSubtotalMinor),
    discountAmount: minorToDecimalString(discountMinor),
    taxAmount: minorToDecimalString(taxAmountMinor),
    lineTotal: minorToDecimalString(lineTotalMinor),
  };
}

/**
 * Calculate full document totals from line items.
 */
export function calculateDocumentTotals(items: LineItemCalculationInput[]): DocumentTotalsCalculated {
  let subtotalMinor = 0n;
  let discountTotalMinor = 0n;
  let taxTotalMinor = 0n;
  let grandTotalMinor = 0n;

  const lines = items.map((item) => {
    const calc = calculateLineItem(item);
    subtotalMinor += calc.lineSubtotalMinor;
    discountTotalMinor += calc.discountMinor;
    taxTotalMinor += calc.taxAmountMinor;
    grandTotalMinor += calc.lineTotalMinor;
    return calc;
  });

  return {
    subtotalMinor,
    discountTotalMinor,
    taxTotalMinor,
    grandTotalMinor,
    subtotal: minorToDecimalString(subtotalMinor),
    discountTotal: minorToDecimalString(discountTotalMinor),
    taxTotal: minorToDecimalString(taxTotalMinor),
    grandTotal: minorToDecimalString(grandTotalMinor),
    lines,
  };
}

/**
 * Add two decimal strings safely in exact minor units.
 */
export function addMoney(a: string | number, b: string | number): string {
  return minorToDecimalString(parseDecimalToScaledBigInt(a, 2) + parseDecimalToScaledBigInt(b, 2));
}

/**
 * Subtract b from a safely in exact minor units.
 */
export function subtractMoney(a: string | number, b: string | number): string {
  return minorToDecimalString(parseDecimalToScaledBigInt(a, 2) - parseDecimalToScaledBigInt(b, 2));
}

/**
 * Compare two decimal money strings: returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
export function compareMoney(a: string | number, b: string | number): -1 | 0 | 1 {
  const ma = parseDecimalToScaledBigInt(a, 2);
  const mb = parseDecimalToScaledBigInt(b, 2);
  if (ma < mb) return -1;
  if (ma > mb) return 1;
  return 0;
}

/**
 * Calculate remaining invoice balance given grandTotal, creditNotesTotal, and amountPaid.
 */
export function calculateInvoiceBalance(
  grandTotal: string | number,
  creditNotesTotal: string | number,
  amountPaid: string | number
): {
  netPayable: string;
  balanceDue: string;
  overpaidAmount: string;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
} {
  const grandMinor = parseDecimalToScaledBigInt(grandTotal, 2);
  const creditMinor = parseDecimalToScaledBigInt(creditNotesTotal, 2);
  const paidMinor = parseDecimalToScaledBigInt(amountPaid, 2);

  const netMinor = grandMinor - creditMinor > 0n ? grandMinor - creditMinor : 0n;
  const rawBalance = netMinor - paidMinor;
  const balanceMinor = rawBalance > 0n ? rawBalance : 0n;
  const overpaidMinor = rawBalance < 0n ? -rawBalance : 0n;

  return {
    netPayable: minorToDecimalString(netMinor),
    balanceDue: minorToDecimalString(balanceMinor),
    overpaidAmount: minorToDecimalString(overpaidMinor),
    isFullyPaid: netMinor > 0n && balanceMinor === 0n,
    isPartiallyPaid: paidMinor > 0n && balanceMinor > 0n,
  };
}

/**
 * Group monetary records strictly by currency — never sums across different currencies
 * unless an explicit conversion rate + timestamp is provided.
 */
export function sumByCurrency<T>(
  records: T[],
  getCurrency: (item: T) => CurrencyCode,
  getAmount: (item: T) => string | number
): Record<CurrencyCode, string> {
  const buckets: Partial<Record<CurrencyCode, bigint>> = {};
  for (const rec of records) {
    const currency = getCurrency(rec);
    const minor = parseDecimalToScaledBigInt(getAmount(rec), 2);
    buckets[currency] = (buckets[currency] ?? 0n) + minor;
  }

  const result = {} as Record<CurrencyCode, string>;
  for (const [code, minor] of Object.entries(buckets) as [CurrencyCode, bigint][]) {
    result[code] = minorToDecimalString(minor);
  }
  return result;
}

/**
 * Convert an amount from one currency to another ONLY when an explicit
 * conversionRate and conversionTimestamp are provided.
 */
export function convertCurrencyWithExplicitRate(params: {
  amount: string | number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  conversionRate: string | number;
  conversionTimestamp: string;
}): {
  convertedAmount: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  conversionRate: string;
  conversionTimestamp: string;
} {
  if (!params.conversionTimestamp) {
    throw new Error('Explicit conversionTimestamp is required for cross-currency conversion');
  }
  const rateScaled6 = parseDecimalToScaledBigInt(params.conversionRate, 6);
  if (rateScaled6 <= 0n) {
    throw new Error('Explicit conversionRate must be greater than zero');
  }
  const amountMinor = parseDecimalToScaledBigInt(params.amount, 2);
  const convertedMinor = divideRoundHalfUp(amountMinor * rateScaled6, 1000000n);
  return {
    convertedAmount: minorToDecimalString(convertedMinor),
    fromCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    conversionRate: String(params.conversionRate),
    conversionTimestamp: params.conversionTimestamp,
  };
}

/**
 * Format a money value with business-configured separators and currency symbol.
 */
export function formatMoney(
  amount: string | number,
  currency: CurrencyCode = 'TZS',
  options?: {
    thousandsSeparator?: string;
    decimalSeparator?: string;
    hideDecimalsForWholeShillings?: boolean;
  }
): string {
  const minor = parseDecimalToScaledBigInt(amount, 2);
  const isNeg = minor < 0n;
  const abs = isNeg ? -minor : minor;
  const whole = (abs / 100n).toString();
  const cents = (abs % 100n).toString().padStart(2, '0');

  const thousandsSep = options?.thousandsSeparator ?? ',';
  const decimalSep = options?.decimalSeparator ?? '.';

  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  const cfg = SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES.TZS;

  const showCents =
    options?.hideDecimalsForWholeShillings &&
    (currency === 'TZS' || currency === 'UGX' || currency === 'RWF') &&
    cents === '00'
      ? ''
      : `${decimalSep}${cents}`;

  return `${isNeg ? '-' : ''}${cfg.symbol} ${groupedWhole}${showCents}`;
}

