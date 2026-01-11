import { defineMiddleware } from "astro:middleware";
import { UserRole } from "../lib/models/user";

const PUBLIC_ROUTES = [
  '/',
  '/registro',
  '/recuperarPassword',
  '/api/auth/login',
  '/api/auth/register'
];

const ROLE_BASED_ROUTES = {
  '/admin': UserRole.ADMIN,
  '/revisor': UserRole.REVISOR,
  '/escritor': UserRole.ESCRITOR,
  '/moderador': UserRole.MODERADOR,
  '/ponente': UserRole.PONENTE,
};

export const onRequest = defineMiddleware(async ({ cookies, url, redirect }, next) => {
  // Permitir acceso a rutas públicas y recursos estáticos
  if (PUBLIC_ROUTES.includes(url.pathname) || url.pathname.startsWith('/_astro') || url.pathname.startsWith('/favicon')) {
    return next();
  }

  const session = cookies.get('session');
  const roleCookie = cookies.get('role');

  if (!session || !session.value) {
    return redirect('/');
  }

  // Check role-based access
  for (const [routePrefix, requiredRole] of Object.entries(ROLE_BASED_ROUTES)) {
    if (url.pathname.startsWith(routePrefix)) {
      if (!roleCookie || roleCookie.value !== requiredRole) {
        // Redirect to home if unauthorized for this specific route
        // Ideally we would redirect to their specific dashboard, but for now home/login is safe
        return redirect('/');
      }
    }
  }

  return next();
});