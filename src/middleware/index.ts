import type { MiddlewareHandler } from 'astro';
import { AuthService } from '../lib/services/auth/auth.service';
import { UserService } from '../lib/services/user/user.service';

/**
 * Rutas protegidas por rol
 */
const PROTECTED_ROUTES = {
    admin: ['/admin'],
    revisor: ['/revisor'],
    moderador: ['/moderador'],
    ponente: ['/ponente']
};

/**
 * Rutas públicas que no requieren autenticación
 */
const PUBLIC_ROUTES = ['/', '/registro', '/recuperarPassword'];

/**
 * Middleware de autenticación y autorización
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
    const { url, redirect } = context;
    const pathname = url.pathname;

    // Permitir rutas públicas
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/api/'))) {
        return next();
    }

    try {
        const authService = new AuthService();
        const userService = new UserService();

        // Verificar autenticación
        const user: any = await new Promise((resolve) => {
            const unsubscribe = authService.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        // Si no hay usuario autenticado, redirigir al login
        if (!user) {
            return redirect('/');
        }

        // Obtener datos del usuario para verificar rol
        const userData = await userService.getUserData(user.uid);

        // Verificar permisos según la ruta
        for (const [role, routes] of Object.entries(PROTECTED_ROUTES)) {
            if (routes.some(route => pathname.startsWith(route))) {
                // Verificar que el usuario tenga el rol correcto
                if (userData.rol !== role) {
                    // Redirigir a la página correspondiente según su rol
                    return redirectToRolePage(userData.rol);
                }
            }
        }

        // Usuario autenticado y autorizado, continuar
        return next();
    } catch (error) {
        console.error('Error in auth middleware:', error);
        return redirect('/');
    }
};

/**
 * Redirige al usuario a su página correspondiente según su rol
 */
function redirectToRolePage(rol: string): Response {
    const rolePages: { [key: string]: string } = {
        admin: '/admin/vistaAdmin',
        revisor: '/revisor/revisor',
        moderador: '/moderador/salasMod',
        ponente: '/ponente/registroValido'
    };

    const targetPage = rolePages[rol] || '/';
    return new Response(null, {
        status: 302,
        headers: {
            Location: targetPage
        }
    });
}
