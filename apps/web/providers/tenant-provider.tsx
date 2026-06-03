'use client'

import { createContext, useContext } from 'react'

export type TenantOrg = {
  id: string
  name: string
  slug: string
  logo: string | null
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'
  currency: string
  timezone: string
}

// Stub until Phase 8 billing module. Always returns TRIAL on free plan.
export type SubscriptionContext = {
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED'
  planId: string | null
  trialEndsAt: Date | null
}

type TenantContextValue = {
  organization: TenantOrg | null
  subscription: SubscriptionContext
}

const TenantContext = createContext<TenantContextValue>({
  organization: null,
  subscription: { status: 'TRIAL', planId: null, trialEndsAt: null },
})

export function TenantProvider({
  organization,
  children,
}: {
  organization: TenantOrg | null
  children: React.ReactNode
}) {
  // Subscription enforcement is Phase 8. Stub returns TRIAL for all orgs.
  const subscription: SubscriptionContext = {
    status: organization?.status ?? 'TRIAL',
    planId: null,
    trialEndsAt: null,
  }

  return (
    <TenantContext.Provider value={{ organization, subscription }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}

export function useSubscription() {
  return useContext(TenantContext).subscription
}
