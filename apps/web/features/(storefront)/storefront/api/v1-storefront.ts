"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type ApiOk<T> = { success: true; data: T }

export type Theme = {
  id: string; name: string; slug: string; type: 'FREE' | 'PREMIUM'; category: string | null
  price: number; previewImage: string | null; description: string | null; author: string | null
}
export type OrgTheme = {
  id: string; organizationId: string; themeId: string; version: string | null
  isActive: boolean; config: string | null; createdAt: string; updatedAt: string
}
export type Page = {
  id: string; organizationId: string; title: string; slug: string; content: string | null
  status: 'DRAFT' | 'PUBLISHED'; metaTitle: string | null; metaDescription: string | null
  ogImage: string | null; canonicalUrl: string | null; createdAt: string; updatedAt: string
}
export type BlogPost = {
  id: string; organizationId: string; title: string; slug: string; excerpt: string | null
  content: string | null; coverImage: string | null; category: string | null; tags: string | null
  status: 'DRAFT' | 'PUBLISHED'; publishedAt: string | null; metaTitle: string | null
  metaDescription: string | null; ogImage: string | null; createdAt: string; updatedAt: string
}
export type Menu = { id: string; organizationId: string; location: 'HEADER' | 'FOOTER' | 'MOBILE'; name: string; items: string | null }
export type Redirect = { id: string; organizationId: string; fromPath: string; toPath: string; type: '301' | '302' }
export type SectionType = 'HERO' | 'CATEGORY_GRID' | 'FEATURED_PRODUCTS' | 'FLASH_SALE' | 'BEST_SELLERS' | 'TESTIMONIALS' | 'BLOG_POSTS' | 'BANNER' | 'CUSTOM_HTML'
export type HomepageSection = { id: string; organizationId: string; type: SectionType; position: number; enabled: boolean; config: string | null }

async function get<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(fallback)
  return (await res.json() as ApiOk<T>).data
}
async function send<T>(url: string, method: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(e.message ?? fallback)
  }
  return (await res.json() as ApiOk<T>).data
}
const BASE = "/api/v1/storefront"

// ─── Themes ───────────────────────────────────────────────────────────────────────
export function useThemeCatalog() {
  return useQuery<Theme[]>({ queryKey: ["v1", "sf", "themes"], queryFn: () => get(`${BASE}/themes`, "Failed to load themes") })
}
export function useInstalledThemes() {
  return useQuery<OrgTheme[]>({ queryKey: ["v1", "sf", "themes", "installed"], queryFn: () => get(`${BASE}/themes/installed`, "Failed to load installed themes") })
}
export function useActiveTheme() {
  return useQuery<OrgTheme | null>({ queryKey: ["v1", "sf", "themes", "active"], queryFn: () => get(`${BASE}/themes/active`, "Failed to load active theme") })
}
function invalidateThemes(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["v1", "sf", "themes"] })
}
export function useInstallTheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (themeId: string) => send<OrgTheme>(`${BASE}/themes/install`, "POST", { themeId }, "Failed to install theme"),
    onSuccess: () => { toast.success("Theme installed"); invalidateThemes(qc) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useActivateTheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orgThemeId: string) => send<OrgTheme>(`${BASE}/themes/${orgThemeId}/activate`, "POST", null, "Failed to activate theme"),
    onSuccess: () => { toast.success("Theme activated"); invalidateThemes(qc) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Pages ────────────────────────────────────────────────────────────────────────
export function usePages() {
  return useQuery<Page[]>({ queryKey: ["v1", "sf", "pages"], queryFn: () => get(`${BASE}/pages`, "Failed to load pages") })
}
export function useCreatePage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Page>) => send<Page>(`${BASE}/pages`, "POST", data, "Failed to create page"),
    onSuccess: () => { toast.success("Page created"); qc.invalidateQueries({ queryKey: ["v1", "sf", "pages"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdatePage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Page>) => send<Page>(`${BASE}/pages/${id}`, "PATCH", data, "Failed to update page"),
    onSuccess: () => { toast.success("Page updated"); qc.invalidateQueries({ queryKey: ["v1", "sf", "pages"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Blog ─────────────────────────────────────────────────────────────────────────
export function useBlogPosts() {
  return useQuery<BlogPost[]>({ queryKey: ["v1", "sf", "blog"], queryFn: () => get(`${BASE}/blog`, "Failed to load posts") })
}
export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BlogPost>) => send<BlogPost>(`${BASE}/blog`, "POST", data, "Failed to create post"),
    onSuccess: () => { toast.success("Post created"); qc.invalidateQueries({ queryKey: ["v1", "sf", "blog"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<BlogPost>) => send<BlogPost>(`${BASE}/blog/${id}`, "PATCH", data, "Failed to update post"),
    onSuccess: () => { toast.success("Post updated"); qc.invalidateQueries({ queryKey: ["v1", "sf", "blog"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Menus ────────────────────────────────────────────────────────────────────────
export function useMenus() {
  return useQuery<Menu[]>({ queryKey: ["v1", "sf", "menus"], queryFn: () => get(`${BASE}/menus`, "Failed to load menus") })
}
export function useSaveMenu() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ location, name, items }: { location: string; name: string; items: unknown }) =>
      send<Menu>(`${BASE}/menus/${location}`, "PUT", { name, items }, "Failed to save menu"),
    onSuccess: () => { toast.success("Menu saved"); qc.invalidateQueries({ queryKey: ["v1", "sf", "menus"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Redirects ──────────────────────────────────────────────────────────────────────
export function useRedirects() {
  return useQuery<Redirect[]>({ queryKey: ["v1", "sf", "redirects"], queryFn: () => get(`${BASE}/redirects`, "Failed to load redirects") })
}
export function useCreateRedirect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { fromPath: string; toPath: string; type?: '301' | '302' }) => send<Redirect>(`${BASE}/redirects`, "POST", data, "Failed to create redirect"),
    onSuccess: () => { toast.success("Redirect created"); qc.invalidateQueries({ queryKey: ["v1", "sf", "redirects"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useDeleteRedirect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send<{ id: string }>(`${BASE}/redirects/${id}`, "DELETE", null, "Failed to delete redirect"),
    onSuccess: () => { toast.success("Redirect deleted"); qc.invalidateQueries({ queryKey: ["v1", "sf", "redirects"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Homepage builder ────────────────────────────────────────────────────────────────
export function useHomepageSections() {
  return useQuery<HomepageSection[]>({ queryKey: ["v1", "sf", "homepage"], queryFn: () => get(`${BASE}/homepage-sections`, "Failed to load sections") })
}
export function useAddSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { type: SectionType; config?: unknown }) => send<HomepageSection>(`${BASE}/homepage-sections`, "POST", data, "Failed to add section"),
    onSuccess: () => { toast.success("Section added"); qc.invalidateQueries({ queryKey: ["v1", "sf", "homepage"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useUpdateSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; position?: number; enabled?: boolean; config?: unknown }) =>
      send<HomepageSection>(`${BASE}/homepage-sections/${id}`, "PATCH", data, "Failed to update section"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["v1", "sf", "homepage"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
export function useDeleteSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => send<{ id: string }>(`${BASE}/homepage-sections/${id}`, "DELETE", null, "Failed to delete section"),
    onSuccess: () => { toast.success("Section removed"); qc.invalidateQueries({ queryKey: ["v1", "sf", "homepage"] }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
