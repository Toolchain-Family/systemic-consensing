const IS_LOCAL = window.location.hostname === 'localhost';

export const AUTH_METHOD = IS_LOCAL ? 'jwt' : 'oidc';

export const DOCPOUCH_URL = IS_LOCAL
    ? 'http://localhost:3031'
    : 'https://docpouch.pantek.app';

export const OIDC_CONFIG = {
    issuer: `${DOCPOUCH_URL}/oidc`,
    clientId: '<OIDC_CLIENT_ID>',
    redirectUri: IS_LOCAL
        ? 'http://localhost:3001/'
        : 'https://tapassio.pantek.ch/Tools/SysConsens/',
    scope: 'openid profile email offline_access',
};

// Struktur der Systemische-Konsens-Sessions auf dem DocPouch-Server (type=6, subType=0)
export const CONSENSUS_STRUCTURE = { type: 6, subType: 0 };
export const TOOL_NAME = 'Systemic Consensing';
