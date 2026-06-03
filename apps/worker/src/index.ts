import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from '../routes/auth'
import products from '../routes/products'
import dashboard from '../routes/dashboard'
import categories from '../routes/categories'
import reviews from '../routes/reviews'
import cart from '../routes/cart'
import checkout from '../routes/checkout'
import orders from '../routes/orders'
import collections from '../routes/collections'
import testimonials from '../routes/testimonials'
import wishlist from '../routes/wishlist'
import analytics from '../routes/analytics'
import steadfast from '../routes/steadfast'
import settings from '../routes/settings'
import inventory from '../routes/inventory'

const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}))

const routes = app
  .route('/auth', auth)
  .route('/products', products)
  .route('/product', dashboard)
  .route('/categories', categories)
  .route('/reviews', reviews)
  .route('/cart', cart)
  .route('/checkout', checkout)
  .route('/orders', orders)
  .route('/collection', collections)
  .route('/testimonials', testimonials)
  .route('/wishlist', wishlist)
  .route('/analytics', analytics)
  .route('/steadfast', steadfast)
  .route('/settings', settings)
  .route('/inventory', inventory)

export type AppType = typeof routes
export default { fetch: app.fetch }
