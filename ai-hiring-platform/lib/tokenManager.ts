/**
 * Global token manager that bridges Clerk's getToken hook
 * with the Axios interceptor (which can't use React hooks).
 *
 * Usage:
 *  - In AuthGuard: call setTokenGetter(getToken) once after Clerk loads
 *  - In api.ts interceptor: call await getFreshToken() on every request
 */

type TokenGetter = () => Promise<string | null>;

let _tokenGetter: TokenGetter | null = null;

export const setTokenGetter = (getter: TokenGetter) => {
    _tokenGetter = getter;
};

export const getFreshToken = async (): Promise<string | null> => {
    if (_tokenGetter) {
        try {
            return await _tokenGetter();
        } catch {
            // Fall back to localStorage if the getter fails
        }
    }
    // Fallback: try localStorage tokens
    if (typeof window !== 'undefined') {
        return localStorage.getItem('clerk_token') || localStorage.getItem('token');
    }
    return null;
};
