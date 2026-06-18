// authGuard.js - Import this on every protected page
import { AuthService } from './services.js';
import { ROUTES } from './config.js';

const user = AuthService.getCurrentUser();

if (!user) {
    window.location.href = ROUTES.LOGIN;
} else if (!user.isGuest) {
    // Validate session against server in the background
    AuthService.validateSession().then(valid => {
        if (!valid) window.location.href = ROUTES.LOGIN;
    });
}