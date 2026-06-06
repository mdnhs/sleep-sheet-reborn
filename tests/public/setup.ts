import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestCtx = { db: ReturnType<typeof drizzle>; sqlite: InstanceType<typeof Database> }

export function createTestDb(): TestCtx {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  sqlite.exec(`
    CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE theme (id TEXT PRIMARY KEY, name TEXT, slug TEXT, type TEXT, category TEXT, price INTEGER, previewImage TEXT, description TEXT, author TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE organization_theme (id TEXT PRIMARY KEY, organizationId TEXT, themeId TEXT, version TEXT, isActive INTEGER, config TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE menu (id TEXT PRIMARY KEY, organizationId TEXT, location TEXT, name TEXT, items TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE homepage_section (id TEXT PRIMARY KEY, organizationId TEXT, type TEXT, position INTEGER, enabled INTEGER, config TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE page (id TEXT PRIMARY KEY, organizationId TEXT, title TEXT, slug TEXT, content TEXT, status TEXT, metaTitle TEXT, metaDescription TEXT, ogImage TEXT, canonicalUrl TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE blog_post (id TEXT PRIMARY KEY, organizationId TEXT, title TEXT, slug TEXT, excerpt TEXT, content TEXT, coverImage TEXT, category TEXT, tags TEXT, status TEXT, publishedAt INTEGER, metaTitle TEXT, metaDescription TEXT, ogImage TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE category (id TEXT PRIMARY KEY, organizationId TEXT, parentId TEXT, name TEXT, slug TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE brand (id TEXT PRIMARY KEY, organizationId TEXT, name TEXT, slug TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE product (id TEXT PRIMARY KEY, organizationId TEXT, categoryId TEXT, brandId TEXT, name TEXT, slug TEXT, description TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE product_variant (id TEXT PRIMARY KEY, organizationId TEXT, productId TEXT, unitId TEXT, sku TEXT, barcode TEXT, name TEXT, costPrice INTEGER, sellingPrice INTEGER, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE product_image (id TEXT PRIMARY KEY, organizationId TEXT, productId TEXT, cloudinaryPublicId TEXT, url TEXT, sortOrder INTEGER, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE location (id TEXT PRIMARY KEY, organizationId TEXT, branchId TEXT, name TEXT, code TEXT, type TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE funnel (id TEXT PRIMARY KEY, organizationId TEXT, templateId TEXT, name TEXT, slug TEXT, type TEXT, config TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE funnel_step (id TEXT PRIMARY KEY, organizationId TEXT, funnelId TEXT, type TEXT, position INTEGER, config TEXT, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE funnel_visit (id TEXT PRIMARY KEY, organizationId TEXT, funnelId TEXT, stepId TEXT, visitorId TEXT, utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, createdAt INTEGER);
  `)
  return { db, sqlite }
}

let n = 0
const id = (p: string) => `${p}-${++n}`
const NOW = Math.floor(Date.now() / 1000)

export function seed(sqlite: InstanceType<typeof Database>) {
  const run = (sql: string, ...a: any[]) => sqlite.prepare(sql).run(...a)
  return {
    org(o: string) { run(`INSERT INTO organization (id,name,slug,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?)`, o, o, o, 'ACTIVE', NOW, NOW); return o },
    theme(tid: string, name: string, slug: string) { run(`INSERT INTO theme (id,name,slug,type,price,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, tid, name, slug, 'FREE', 0, 'ACTIVE', NOW, NOW); return tid },
    activate(o: string, tid: string, config: string) { run(`INSERT INTO organization_theme (id,organizationId,themeId,version,isActive,config,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, id('ot'), o, tid, '1.0.0', 1, config, NOW, NOW) },
    menu(o: string, location: string, items: string) { run(`INSERT INTO menu (id,organizationId,location,name,items,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`, id('menu'), o, location, location, items, NOW, NOW) },
    section(o: string, type: string, position: number, enabled: number, config: string) { run(`INSERT INTO homepage_section (id,organizationId,type,position,enabled,config,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, id('sec'), o, type, position, enabled, config, NOW, NOW) },
    page(o: string, slug: string, status: string) { run(`INSERT INTO page (id,organizationId,title,slug,content,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, id('pg'), o, slug, slug, 'body', status, NOW, NOW) },
    post(o: string, slug: string, status: string) { run(`INSERT INTO blog_post (id,organizationId,title,slug,status,publishedAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, id('post'), o, slug, slug, status, NOW, NOW, NOW) },
    category(o: string, slug: string, status = 'ACTIVE') { const i = id('cat'); run(`INSERT INTO category (id,organizationId,name,slug,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`, i, o, slug, slug, status, NOW, NOW); return i },
    product(o: string, slug: string, status: string, categoryId: string | null = null) { const i = id('prod'); run(`INSERT INTO product (id,organizationId,categoryId,name,slug,description,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`, i, o, categoryId, slug, slug, 'desc', status, NOW, NOW); return i },
    variant(o: string, productId: string, sellingPrice: number) { run(`INSERT INTO product_variant (id,organizationId,productId,sku,name,costPrice,sellingPrice,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)`, id('var'), o, productId, id('sku'), 'v', 0, sellingPrice, 'ACTIVE', NOW, NOW) },
    image(o: string, productId: string, url: string, sortOrder: number) { run(`INSERT INTO product_image (id,organizationId,productId,url,sortOrder,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`, id('img'), o, productId, url, sortOrder, NOW, NOW) },
    location(o: string, type = 'OUTLET', status = 'ACTIVE') { const i = id('loc'); run(`INSERT INTO location (id,organizationId,name,code,type,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, i, o, i, i, type, status, NOW, NOW); return i },
    funnel(o: string, slug: string, status = 'ACTIVE', config: string | null = null, type = 'SINGLE') { const i = id('fnl'); run(`INSERT INTO funnel (id,organizationId,name,slug,type,config,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`, i, o, slug, slug, type, config, status, NOW, NOW); return i },
    step(o: string, funnelId: string, type: string, position: number, config: string | null = null) { const i = id('stp'); run(`INSERT INTO funnel_step (id,organizationId,funnelId,type,position,config,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`, i, o, funnelId, type, position, config, NOW, NOW); return i },
  }
}
