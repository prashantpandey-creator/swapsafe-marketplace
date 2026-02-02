/**
 * Unique ID Validators
 * 
 * Validates unique identifiers like IMEI, VIN, Serial numbers
 * for Digital Twin verification.
 */

/**
 * Validate IMEI using Luhn algorithm
 * IMEI is 15 digits, last digit is a check digit
 */
export function validateIMEI(imei) {
    // Remove any spaces or dashes
    const cleaned = imei.replace(/[\s-]/g, '');

    // Must be exactly 15 digits
    if (!/^\d{15}$/.test(cleaned)) {
        return {
            valid: false,
            error: 'IMEI must be exactly 15 digits'
        };
    }

    // Luhn algorithm check
    let sum = 0;
    for (let i = 0; i < 14; i++) {
        let digit = parseInt(cleaned[i], 10);
        if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    const valid = checkDigit === parseInt(cleaned[14], 10);

    return {
        valid,
        cleaned,
        masked: `***${cleaned.slice(-8)}`,
        error: valid ? null : 'Invalid IMEI checksum'
    };
}

/**
 * Validate VIN (Vehicle Identification Number)
 * VIN is 17 characters, alphanumeric (no I, O, Q)
 */
export function validateVIN(vin) {
    const cleaned = vin.toUpperCase().replace(/[\s-]/g, '');

    // Must be exactly 17 characters
    if (cleaned.length !== 17) {
        return {
            valid: false,
            error: 'VIN must be exactly 17 characters'
        };
    }

    // No I, O, Q allowed
    if (/[IOQ]/.test(cleaned)) {
        return {
            valid: false,
            error: 'VIN cannot contain letters I, O, or Q'
        };
    }

    // Must be alphanumeric
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) {
        return {
            valid: false,
            error: 'VIN must be alphanumeric (no I, O, Q)'
        };
    }

    // VIN check digit validation (position 9)
    const transliteration = {
        A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
        J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
        S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9
    };

    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
        const char = cleaned[i];
        const value = /\d/.test(char) ? parseInt(char, 10) : transliteration[char];
        sum += value * weights[i];
    }

    const remainder = sum % 11;
    const checkChar = remainder === 10 ? 'X' : String(remainder);
    const valid = cleaned[8] === checkChar;

    return {
        valid,
        cleaned,
        masked: `***${cleaned.slice(-6)}`,
        error: valid ? null : 'Invalid VIN check digit'
    };
}

/**
 * Validate ISBN (10 or 13 digits)
 */
export function validateISBN(isbn) {
    const cleaned = isbn.replace(/[\s-]/g, '');

    // ISBN-10
    if (cleaned.length === 10) {
        if (!/^\d{9}[\dX]$/.test(cleaned)) {
            return { valid: false, error: 'Invalid ISBN-10 format' };
        }

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned[i], 10) * (10 - i);
        }
        const lastChar = cleaned[9].toUpperCase();
        sum += lastChar === 'X' ? 10 : parseInt(lastChar, 10);

        const valid = sum % 11 === 0;
        return {
            valid,
            cleaned,
            masked: `***${cleaned.slice(-6)}`,
            error: valid ? null : 'Invalid ISBN-10 checksum'
        };
    }

    // ISBN-13
    if (cleaned.length === 13) {
        if (!/^\d{13}$/.test(cleaned)) {
            return { valid: false, error: 'Invalid ISBN-13 format' };
        }

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleaned[i], 10) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        const valid = checkDigit === parseInt(cleaned[12], 10);

        return {
            valid,
            cleaned,
            masked: `***${cleaned.slice(-6)}`,
            error: valid ? null : 'Invalid ISBN-13 checksum'
        };
    }

    return { valid: false, error: 'ISBN must be 10 or 13 digits' };
}

/**
 * Validate MAC Address
 */
export function validateMAC(mac) {
    const cleaned = mac.replace(/[\s:-]/g, '').toUpperCase();

    if (!/^[0-9A-F]{12}$/.test(cleaned)) {
        return {
            valid: false,
            error: 'MAC address must be 12 hexadecimal characters'
        };
    }

    return {
        valid: true,
        cleaned,
        masked: `***${cleaned.slice(-6)}`,
        formatted: cleaned.match(/.{2}/g).join(':')
    };
}

/**
 * Validate Serial Number (generic)
 * Just checks it's alphanumeric and reasonable length
 */
export function validateSerial(serial) {
    const cleaned = serial.replace(/[\s]/g, '').toUpperCase();

    if (cleaned.length < 5) {
        return { valid: false, error: 'Serial number too short' };
    }

    if (cleaned.length > 30) {
        return { valid: false, error: 'Serial number too long' };
    }

    if (!/^[A-Z0-9\-_]+$/i.test(cleaned)) {
        return { valid: false, error: 'Serial number must be alphanumeric' };
    }

    return {
        valid: true,
        cleaned,
        masked: cleaned.length > 6 ? `***${cleaned.slice(-6)}` : `***${cleaned.slice(-3)}`
    };
}

/**
 * Main validation function - routes to appropriate validator
 */
export function validateUniqueId(value, type) {
    if (!value || !value.trim()) {
        return { valid: false, error: 'ID is required' };
    }

    switch (type?.toLowerCase()) {
        case 'imei':
            return validateIMEI(value);
        case 'vin':
            return validateVIN(value);
        case 'isbn':
            return validateISBN(value);
        case 'mac':
            return validateMAC(value);
        case 'serial':
        case 'sku':
        default:
            return validateSerial(value);
    }
}

export default {
    validateIMEI,
    validateVIN,
    validateISBN,
    validateMAC,
    validateSerial,
    validateUniqueId
};
