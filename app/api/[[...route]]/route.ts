import {Hono} from "hono";
import {handle} from "hono/vercel";
import auth from "@/features/auth/server/route"
import products from "@/features/product/server/route"
import product from "@/features/dashboard/server/route"
import categories from "@/features/categories/server/route"
import review from "@/features/review/server/route"
import checkout from "@/features/checkout/server/route"
import cart from "@/features/cart/server/route"
import orders from "@/features/order/server/route"
import collection from "@/features/collections/server/route"
import testimonials from "@/features/testimonials/server/route"
import wishlist from "@/features/wishlist/server/route"
import analytics from "@/features/analytics/server/route";
import steadfast from "@/features/steadfast/server/route";
import settings from "@/features/settings/server/route";
const app = new Hono().basePath("/api");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes =app
.route("/auth",auth)
.route("/products",products)
.route("/product",product)
.route("/categories",categories)
.route("/reviews",review)
.route("/cart",cart)
.route("/checkout",checkout)
.route("/orders",orders)
.route("/collection",collection)
.route("/testimonials",testimonials)
.route("/wishlist",wishlist)
.route("/analytics",analytics)
.route("/steadfast",steadfast)
.route("/settings",settings)



export const GET = handle(app)
export const POST = handle(app)
export const PUT =handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export type AppType = typeof routes;
