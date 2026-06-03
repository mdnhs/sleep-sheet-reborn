import type { Organization } from '@repo/database'

export type TenantContext = {
  organizationId: string
  organization: Organization
}

/** Wraps query params to inject organizationId from tenant context.
 *  organizationId NEVER comes from request input — always from resolved tenant. */
export function withTenant<T extends Record<string, unknown>>(
  tenant: TenantContext,
  params: Omit<T, 'organizationId'> = {} as Omit<T, 'organizationId'>
): T & { organizationId: string } {
  return { ...params, organizationId: tenant.organizationId } as T & { organizationId: string }
}

/** Asserts tenant context is present. Throws if missing. */
export function assertTenant(tenant: Organization | null | undefined): Organization {
  if (!tenant) {
    throw new Error('Tenant context missing. Ensure tenantMiddleware runs before this handler.')
  }
  return tenant
}

/** Active means the org can perform business operations. */
export function isOrgActive(status: Organization['status']): boolean {
  return status === 'ACTIVE' || status === 'TRIAL'
}
