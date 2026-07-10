export type FormErrors<T extends string> = Partial<Record<T, string>>;

export const MOBILE_HELP = 'Enter a valid 11-digit mobile number starting with 09.';
export const PASSWORD_HELP = 'Use at least 8 characters with uppercase, lowercase, number, and symbol.';

export function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhilippineMobile(value: string) {
    return /^09\d{9}$/.test(value.trim());
}

export function normalizeNumericInput(value: string) {
    return value.replace(/[^\d]/g, '');
}

export function isValidPassword(value: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
}

export function isFutureDate(value: string) {
    if (!value) {
        return false;
    }

    const input = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return input.getTime() > today.getTime();
}

export function focusFirstInvalidField(errors: Record<string, unknown>) {
    const firstField = Object.keys(errors).find((key) => errors[key]);
    if (!firstField || typeof document === 'undefined') {
        return;
    }

    window.requestAnimationFrame(() => {
        const field = document.querySelector<HTMLElement>(`[name="${firstField}"]`);
        field?.focus();
        field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
}

export function friendlyError(message: string) {
    if (!message || /prisma|database|stack|exception|sql/i.test(message)) {
        return 'Something went wrong while saving. Please review the form and try again.';
    }

    return message;
}
