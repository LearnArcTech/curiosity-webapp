const DEFAULT_BACKEND = 'http://localhost:8000';

function getApiBase() {
    const configured = localStorage.getItem('curiosityApiBase');
    if (configured) return configured.replace(/\/$/, '');
    if (location.protocol === 'file:') return DEFAULT_BACKEND;
    if (location.port === '8000') return '';
    return DEFAULT_BACKEND;
}

function getToken() {
    return localStorage.getItem('authToken') || '';
}

async function request(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${getApiBase()}${path}`, {
        ...options,
        headers
    });

    let payload = null;
    const text = await response.text();
    if (text) {
        payload = JSON.parse(text);
    }

    if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo completar la solicitud');
    }
    return payload;
}

const ApiClient = {
    get enabled() {
        return localStorage.getItem('curiosityBackendDisabled') !== 'true';
    },

    async get(path) {
        if (!this.enabled) return null;
        return request(path);
    },

    async post(path, body = {}) {
        if (!this.enabled) return null;
        return request(path, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    async patch(path, body = {}) {
        if (!this.enabled) return null;
        return request(path, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    async delete(path) {
        if (!this.enabled) return null;
        return request(path, { method: 'DELETE' });
    },

    storeSession({ token, user }) {
        if (token) localStorage.setItem('authToken', token);
        if (user) localStorage.setItem('currentUser', JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem('authToken');
    }
};

export { ApiClient };
