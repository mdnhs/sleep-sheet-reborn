import {Hono} from "hono";
import {handle} from "hono/vercel";

export const dynamic = "force-dynamic";
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
import blog from "@/features/blog/server/route";
import pos from "@/features/pos/server/route";
import reports from "@/features/reports/server/route";
import expenses from "@/features/expenses/server/route";
import roles from "@/features/roles/server/route";
import users from "@/features/users/server/route";
import traffic from "@/features/traffic/server/route";
import activity from "@/features/activity/server/route";
import { logActivity } from "@/features/activity/server/log-activity";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api");
app.use("*", cors());
// Audit trail: records every mutating request made by a dashboard user.
app.use("*", logActivity);

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
.route("/blog",blog)
.route("/pos",pos)
.route("/reports",reports)
.route("/expenses",expenses)
.route("/roles",roles)
.route("/users",users)
.route("/traffic",traffic)
.route("/activity",activity)

export const GET = handle(app)
export const POST = handle(app)
export const PUT =handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
export type AppType = typeof routes;
