/**
 * Authentication & Authorization Helpers
 *
 * Provides secure user session retrieval and organization-scoped queries
 */

import { auth } from "@/lib/auth-client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
}

/**
 * Get the current authenticated user from request headers
 * @throws Error if not authenticated
 */
export async function getCurrentUser(req: Request): Promise<AuthenticatedUser> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      throw new Error("Unauthorized: No valid session");
    }

    // Vybe platform provides user context
    const user = session.user as any;

    if (!user.organizationId) {
      throw new Error("Unauthorized: No organization context");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
    };
  } catch (error) {
    console.error("[auth-helpers] Authentication failed:", error);
    throw new Error("Unauthorized");
  }
}

/**
 * Add organization filter to SQL query for multi-tenant isolation
 *
 * @example
 * const { sql, params } = addOrgFilter(
 *   "SELECT * FROM automation_rules WHERE enabled = $1",
 *   [true],
 *   user.organizationId
 * );
 * // Returns: "SELECT * FROM automation_rules WHERE enabled = $1 AND organization_id = $2"
 * // Params: [true, "org-123"]
 */
export function addOrgFilter(
  sql: string,
  params: any[],
  organizationId: string
): { sql: string; params: any[] } {
  return {
    sql: `${sql} AND organization_id = $${params.length + 1}`,
    params: [...params, organizationId],
  };
}

/**
 * Create a new API error response with proper status code
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string
) {
  return Response.json(
    {
      error: {
        message,
        code: code || `error_${status}`,
        type: "api_error",
      },
    },
    { status }
  );
}

/**
 * Handle authentication errors consistently
 */
export function handleAuthError(error: any) {
  console.error("[auth] Authentication error:", error);
  return createErrorResponse(
    "Authentication required. Please sign in.",
    401,
    "unauthorized"
  );
}
