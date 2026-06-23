/**
 * Validates a card number for Mastercard qualifications.
 * Mastercard starts with:
 *  - 51-55 (16 digits)
 *  - 2221-2720 (16 digits)
 * Must pass Luhn algorithm (Mod 10).
 */
export function isMastercard(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\s|-/g, '');
  
  // Basic numeric and length check (Mastercard is exactly 16 digits)
  if (!/^\d{16}$/.test(sanitized)) {
    return false;
  }

  // Prefix verification
  const prefix2 = parseInt(sanitized.slice(0, 2), 10);
  const prefix4 = parseInt(sanitized.slice(0, 4), 10);

  const isValidPrefix = (prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720);
  if (!isValidPrefix) {
    return false;
  }

  // Luhn Algorithm (Mod 10)
  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Identify card type primarily to display to help users correct their choices
 */
export function getCardType(cardNumber: string): 'Mastercard' | 'Visa' | 'Amex' | 'Discover' | 'Unknown' {
  const sanitized = cardNumber.replace(/\s|-/g, '');
  if (/^4/.test(sanitized)) return 'Visa';
  if (/^5[1-5]|^2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720)/.test(sanitized)) return 'Mastercard';
  if (/^3[47]/.test(sanitized)) return 'Amex';
  if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
  return 'Unknown';
}
