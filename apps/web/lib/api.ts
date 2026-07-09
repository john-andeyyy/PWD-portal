export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export async function parseApiError(response: Response) {
    try {
        const body = await response.json();

        if (Array.isArray(body?.message)) {
            return body.message.join(', ');
        }

        if (typeof body?.message === 'string' && body.message.trim() !== '') {
            return body.message;
        }

        if (typeof body?.error === 'string' && body.error.trim() !== '') {
            return body.error;
        }
    } catch {
        // Ignore malformed response bodies.
    }

    return response.statusText || 'Request failed.';
}
