import { eq, and, desc, asc } from 'drizzle-orm'
import { page, blogPost, menu, redirect, homepageSection } from '@repo/database/schema'
import type {
  Database, NewPage, Page, NewBlogPost, BlogPost, NewMenu, Menu,
  NewRedirect, Redirect, NewHomepageSection, HomepageSection,
} from '@repo/database'
import { generateId } from '../utils/id'

export function createStorefrontCmsRepository(db: Database, organizationId: string) {
  const pageScope = eq(page.organizationId, organizationId)
  const blogScope = eq(blogPost.organizationId, organizationId)
  const menuScope = eq(menu.organizationId, organizationId)
  const redirectScope = eq(redirect.organizationId, organizationId)
  const sectionScope = eq(homepageSection.organizationId, organizationId)

  return {
    // ── Pages ───────────────────────────────────────────────────────────────────
    findPages(status?: Page['status']) {
      const where = status ? and(pageScope, eq(page.status, status)) : pageScope
      return db.select().from(page).where(where).orderBy(desc(page.updatedAt))
    },
    findPage(id: string) {
      return db.select().from(page).where(and(pageScope, eq(page.id, id))).then(r => r[0] ?? null)
    },
    findPageBySlug(slug: string) {
      return db.select().from(page).where(and(pageScope, eq(page.slug, slug))).then(r => r[0] ?? null)
    },
    async createPage(data: Omit<NewPage, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewPage = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(page).values(row)
      return row
    },
    async updatePage(id: string, data: Partial<Omit<NewPage, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(page).set({ ...data, updatedAt: new Date() }).where(and(pageScope, eq(page.id, id)))
      return this.findPage(id)
    },

    // ── Blog ──────────────────────────────────────────────────────────────────────
    findPosts(status?: BlogPost['status']) {
      const where = status ? and(blogScope, eq(blogPost.status, status)) : blogScope
      return db.select().from(blogPost).where(where).orderBy(desc(blogPost.createdAt))
    },
    findPost(id: string) {
      return db.select().from(blogPost).where(and(blogScope, eq(blogPost.id, id))).then(r => r[0] ?? null)
    },
    findPostBySlug(slug: string) {
      return db.select().from(blogPost).where(and(blogScope, eq(blogPost.slug, slug))).then(r => r[0] ?? null)
    },
    async createPost(data: Omit<NewBlogPost, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewBlogPost = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(blogPost).values(row)
      return row
    },
    async updatePost(id: string, data: Partial<Omit<NewBlogPost, 'id' | 'organizationId' | 'createdAt'>>) {
      await db.update(blogPost).set({ ...data, updatedAt: new Date() }).where(and(blogScope, eq(blogPost.id, id)))
      return this.findPost(id)
    },

    // ── Menus ───────────────────────────────────────────────────────────────────
    findMenus() {
      return db.select().from(menu).where(menuScope).orderBy(menu.location)
    },
    findMenuByLocation(location: Menu['location']) {
      return db.select().from(menu).where(and(menuScope, eq(menu.location, location))).then(r => r[0] ?? null)
    },
    async upsertMenu(location: Menu['location'], data: { name: string; items: string }) {
      const existing = await this.findMenuByLocation(location)
      const now = new Date()
      if (existing) {
        await db.update(menu).set({ name: data.name, items: data.items, updatedAt: now }).where(and(menuScope, eq(menu.id, existing.id)))
        return this.findMenuByLocation(location)
      }
      const row: NewMenu = { id: generateId(), organizationId, location, name: data.name, items: data.items, createdAt: now, updatedAt: now }
      await db.insert(menu).values(row)
      return row
    },

    // ── Redirects ─────────────────────────────────────────────────────────────────
    findRedirects() {
      return db.select().from(redirect).where(redirectScope).orderBy(desc(redirect.createdAt))
    },
    findRedirectByFrom(fromPath: string) {
      return db.select().from(redirect).where(and(redirectScope, eq(redirect.fromPath, fromPath))).then(r => r[0] ?? null)
    },
    async createRedirect(data: { fromPath: string; toPath: string; type: Redirect['type'] }) {
      const now = new Date()
      const row: NewRedirect = { id: generateId(), organizationId, ...data, createdAt: now, updatedAt: now }
      await db.insert(redirect).values(row)
      return row
    },
    async deleteRedirect(id: string) {
      await db.delete(redirect).where(and(redirectScope, eq(redirect.id, id)))
    },

    // ── Homepage sections ─────────────────────────────────────────────────────────
    findSections() {
      return db.select().from(homepageSection).where(sectionScope).orderBy(asc(homepageSection.position))
    },
    findSection(id: string) {
      return db.select().from(homepageSection).where(and(sectionScope, eq(homepageSection.id, id))).then(r => r[0] ?? null)
    },
    async createSection(data: Omit<NewHomepageSection, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
      const now = new Date()
      const row: NewHomepageSection = { ...data, id: generateId(), organizationId, createdAt: now, updatedAt: now }
      await db.insert(homepageSection).values(row)
      return row
    },
    async updateSection(id: string, data: Partial<Pick<HomepageSection, 'type' | 'position' | 'enabled' | 'config'>>) {
      await db.update(homepageSection).set({ ...data, updatedAt: new Date() }).where(and(sectionScope, eq(homepageSection.id, id)))
      return this.findSection(id)
    },
    async deleteSection(id: string) {
      await db.delete(homepageSection).where(and(sectionScope, eq(homepageSection.id, id)))
    },
  }
}

export type StorefrontCmsRepository = ReturnType<typeof createStorefrontCmsRepository>
