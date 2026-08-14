import { ref } from 'vue';
import DocPouchClient from 'docpouch-client';
import { DOCPOUCH_URL, OIDC_CONFIG, AUTH_METHOD } from '../config/docpouch.js';

const dpClient = new DocPouchClient(DOCPOUCH_URL);
dpClient.setOidcConfig(OIDC_CONFIG);

export const isAuthenticated = ref(false);
export const authInitialized = ref(false);
export const userName = ref('');
export const currentUserId = ref('');
export const loginError = ref('');

export async function initAuth() {
    // Case 1: Rückkehr von einem OIDC-Login (URL enthält ?code=...)
    if (window.location.search.includes('code=')) {
        const ok = await dpClient.handleOidcCallback();
        if (ok) {
            window.history.replaceState({}, '', window.location.pathname);
            await onLoginSuccess();
        }
        authInitialized.value = true;
        return;
    }

    // Case 2: Bereits per JWT eingeloggt
    if (dpClient.isAuthenticated()) {
        await onLoginSuccess();
        authInitialized.value = true;
        return;
    }

    // Case 3: Bestehende OIDC-Session wiederherstellen
    if (dpClient.restoreOidcSession()) {
        try {
            await dpClient.ensureValidOidcToken();
            await onLoginSuccess();
        } catch (e) {
            isAuthenticated.value = false;
        }
    }
    authInitialized.value = true;
}

// Lokale Entwicklung: Benutzername + Passwort
export async function loginJwt(username, password) {
    loginError.value = '';
    try {
        await dpClient.login({ name: username, password });
        await onLoginSuccess();
    } catch (e) {
        loginError.value = 'Login fehlgeschlagen. Benutzername oder Passwort falsch.';
    }
}

// Produktion: OIDC-Redirect
export function loginOidc() {
    dpClient.loginWithOidc(OIDC_CONFIG);
}

export async function logout() {
    await dpClient.logout();
    isAuthenticated.value = false;
    userName.value = '';
}

async function onLoginSuccess() {
    isAuthenticated.value = true;
    try {
        const token = dpClient.getToken();
        if (token) {
            const res = await fetch(`${DOCPOUCH_URL}/users/whoami`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const info = await res.json();
                userName.value = info.name || info.userName || info.user?.username || '';
                currentUserId.value = info._id || info.id || '';
            }
        }
    } catch (e) {
        userName.value = '';
    }
}

export { dpClient, AUTH_METHOD };
