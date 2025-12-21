/**
 * Password Validation Utility
 * Validates password strength based on cybersecurity standards (NIST/OWASP)
 */

export interface PasswordValidationResult {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    score: number; // 0-100
    errors: string[];
    suggestions: string[];
    requirements: {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        number: boolean;
        special: boolean;
    };
}

// Common passwords to reject (top 100 most common)
const COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
    'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
    'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
    'qazwsx', 'michael', 'football', 'password1', 'password123', 'admin', 'welcome',
    'login', 'princess', 'solo', 'starwars', 'hello', 'freedom', 'whatever',
    'ninja', 'mustang', 'mercedes', 'charlie', 'donald', 'batman', 'matrix'
];

/**
 * Validates password strength and returns detailed feedback
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Check requirements
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    // Calculate score based on requirements
    if (requirements.length) score += 20;
    if (requirements.uppercase) score += 15;
    if (requirements.lowercase) score += 15;
    if (requirements.number) score += 15;
    if (requirements.special) score += 15;

    // Bonus points for length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Check for common passwords
    const isCommon = COMMON_PASSWORDS.some(common =>
        password.toLowerCase().includes(common)
    );

    if (isCommon) {
        score = Math.max(0, score - 30);
        errors.push('Esta contraseña es muy común y fácil de adivinar');
        suggestions.push('Usa una combinación única de palabras o frases');
    }

    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
        score = Math.max(0, score - 10);
        suggestions.push('Evita secuencias de caracteres (abc, 123, etc.)');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
        score = Math.max(0, score - 10);
        suggestions.push('Evita repetir el mismo carácter muchas veces');
    }

    // Generate errors for unmet requirements
    if (!requirements.length) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!requirements.uppercase) {
        errors.push('Debe incluir al menos una letra mayúscula');
    }
    if (!requirements.lowercase) {
        errors.push('Debe incluir al menos una letra minúscula');
    }
    if (!requirements.number) {
        errors.push('Debe incluir al menos un número');
    }
    if (!requirements.special) {
        errors.push('Debe incluir al menos un carácter especial (!@#$%^&*)');
    }

    // Add suggestions based on score
    if (score < 60 && password.length < 12) {
        suggestions.push('Considera usar al menos 12 caracteres para mayor seguridad');
    }
    if (score >= 60 && score < 80 && !requirements.special) {
        suggestions.push('Agrega caracteres especiales para mejorar la seguridad');
    }

    // Determine strength level
    let strength: PasswordValidationResult['strength'];
    if (score < 40) {
        strength = 'weak';
    } else if (score < 60) {
        strength = 'medium';
    } else if (score < 80) {
        strength = 'strong';
    } else {
        strength = 'very-strong';
    }

    // Password is valid if all requirements are met
    const isValid = Object.values(requirements).every(req => req === true);

    return {
        isValid,
        strength,
        score,
        errors,
        suggestions,
        requirements,
    };
}

/**
 * Generates SHA-1 hash of a string (for HIBP API)
 */
export async function sha1Hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.toUpperCase();
}

/**
 * Checks if password has been pwned using HIBP API (k-anonymity model)
 * This should be called from the server-side for security
 */
export async function checkPasswordPwned(password: string): Promise<{
    isPwned: boolean;
    count: number;
}> {
    try {
        // Generate SHA-1 hash
        const hash = await sha1Hash(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);

        // Call HIBP API with k-anonymity
        const response = await fetch(
            `https://api.pwnedpasswords.com/range/${prefix}`,
            {
                headers: {
                    'Add-Padding': 'true', // Extra security
                },
            }
        );

        if (!response.ok) {
            console.error('HIBP API error:', response.status);
            return { isPwned: false, count: 0 };
        }

        const text = await response.text();
        const hashes = text.split('\n');

        // Check if our hash suffix is in the list
        for (const line of hashes) {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix === suffix) {
                return {
                    isPwned: true,
                    count: parseInt(count, 10),
                };
            }
        }

        return { isPwned: false, count: 0 };
    } catch (error) {
        console.error('Error checking password:', error);
        // Don't block registration if API fails
        return { isPwned: false, count: 0 };
    }
}

/**
 * Get strength label in Spanish
 */
export function getStrengthLabel(strength: PasswordValidationResult['strength']): string {
    const labels = {
        'weak': 'Débil',
        'medium': 'Media',
        'strong': 'Fuerte',
        'very-strong': 'Muy Fuerte',
    };
    return labels[strength];
}

/**
 * Get strength color
 */
export function getStrengthColor(strength: PasswordValidationResult['strength']): string {
    const colors = {
        'weak': '#ef4444',
        'medium': '#f59e0b',
        'strong': '#10b981',
        'very-strong': '#059669',
    };
    return colors[strength];
}
