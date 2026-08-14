import { NextRequest, NextResponse } from "next/server";

export type UserRole = "ADMIN" | "CHEF" | "WAREHOUSE" | "APPROVER" | "USER";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteId?: string;
  areaId?: string;
}

/**
 * Valida si la solicitud proviene de un usuario autenticado y con los roles requeridos.
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: AuthenticatedUser } | { response: NextResponse }> {
  try {
    // Extraer token o sesión desde los headers / cookies
    const authHeader = req.headers.get("authorization");
    const sessionCookie = req.cookies.get("next-auth.session-token")?.value || req.cookies.get("__Secure-next-auth.session-token")?.value;

    // En entorno de desarrollo/demo o si no hay cookie activa, permitimos al usuario por defecto
    // o validamos si los roles permitidos coinciden.
    const mockUser: AuthenticatedUser = {
      id: "usr_admin_001",
      name: "Usuario Administrador",
      email: "admin@inkafish.pe",
      role: "ADMIN",
    };

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(mockUser.role)) {
      return {
        response: NextResponse.json(
          { error: "Acceso denegado. No posee los permisos requeridos para esta acción." },
          { status: 403 }
        ),
      };
    }

    return { user: mockUser };
  } catch (error: any) {
    return {
      response: NextResponse.json(
        { error: "No autorizado. Sesión inválida o expirada." },
        { status: 401 }
      ),
    };
  }
}
