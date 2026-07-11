"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowUpRight,
  Heart,
  Loader2,
  LockKeyhole,
  LayoutDashboard,
  MapPin,
  Package2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrent } from "@/features/auth/api/use-current";
import { useUpdateProfile } from "@/features/auth/api/use-update-profile";
import { useGetOrder } from "@/features/order/api/use-get-order";
import { useDeleteFromWishlist } from "@/features/wishlist/api/use-delete-from-wishlist";
import { useWishlist } from "@/features/wishlist/api/use-wishlist";
import { useCurrency } from "@/hooks/use-currency";
import { cn, formatDate } from "@/lib/utils";

interface AccountClientPageProps {
  name: string;
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[22px] border border-border/60 bg-background/80 p-3 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-2xl bg-foreground px-2 py-1.5 text-background">
          <Icon className="size-4" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="space-y-0.5">
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </label>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-border/70 bg-background/70 px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-border/70 bg-muted/40">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {cta ? <div className="mt-6 flex justify-center">{cta}</div> : null}
    </div>
  );
}

function getStatusClasses(status: string) {
  switch (status) {
    case "DELIVERED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "SHIPPED":
    case "SHIPPING":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "PROCESSING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    default:
      return "border-border bg-muted/50 text-foreground/70";
  }
}

function AccountClientPage({ name }: AccountClientPageProps) {
  const { data: orders } = useGetOrder();
  const { data: wishlist } = useWishlist();
  const { data: currentUser } = useCurrent();
  const { formatAmount } = useCurrency();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: deleteWishlist, isPending: deletingWishlist } =
    useDeleteFromWishlist();

  const ordersList = orders?.order ?? [];
  const wishlistItems = wishlist?.items ?? [];
  const latestOrder = ordersList[0];
  const hasAddress = Boolean(currentUser?.address?.trim());
  const displayName = currentUser?.name || name || "Customer";

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        name: currentUser.name ?? "",
        phone: currentUser.phone ?? "",
        address: currentUser.address ?? "",
      });
    }
  }, [currentUser, profileForm]);

  const onProfileSubmit = (values: ProfileValues) => {
    updateProfile(values);
  };

  const onPasswordSubmit = (values: PasswordValues) => {
    updateProfile(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      { onSuccess: () => passwordForm.reset() },
    );
  };

  const handleDeleteWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteWishlist({ productId: id });
  };

  return (
    <div className="relative overflow-hidden">
      {/* <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,theme(colors.primary/.025),transparent_26%),radial-gradient(circle_at_top_right,theme(colors.foreground/.01),transparent_12%),linear-gradient(to_bottom,theme(colors.muted/.06),transparent_20%)]" /> */}
      <div className="container mx-auto px-3 py-6 sm:px-4 md:py-12">
        <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-background/92 p-4 shadow-[0_18px_48px_-36px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:rounded-[32px] sm:p-5 xl:p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.35fr)_340px]">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  <Sparkles className="size-3.5" />
                  Account hub
                </Badge>
                {currentUser && (currentUser.role !== "USER" || (currentUser.permissions && currentUser.permissions.length > 0)) && (
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="rounded-full h-8 px-4 font-medium hover:bg-muted">
                      <LayoutDashboard className="mr-2 size-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                <h1 className="max-w-2xl text-xl font-semibold tracking-tight sm:text-3xl">
                  Welcome back, {displayName}.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Track orders, keep delivery details ready, and keep your saved
                  products close. Everything important lives here now.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  icon={Package2}
                  label="Orders"
                  value={String(ordersList.length)}
                  hint={
                    latestOrder
                      ? `Latest ${formatDate(latestOrder.createdAt)}`
                      : "No purchases yet"
                  }
                />
                <MetricCard
                  icon={Heart}
                  label="Wishlist"
                  value={String(wishlistItems.length)}
                  hint={
                    wishlistItems.length
                      ? "Saved for later"
                      : "No saved items yet"
                  }
                />
                <MetricCard
                  icon={MapPin}
                  label="Address"
                  value={hasAddress ? "Ready" : "Missing"}
                  hint={
                    hasAddress
                      ? "Delivery info available"
                      : "Add an address for faster checkout"
                  }
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-border/60 bg-muted/20 p-4 sm:rounded-[26px]">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Profile overview
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-[20px] bg-foreground text-background shadow-sm">
                  <UserRound className="size-5" />
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/70 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">
                    {currentUser?.phone || "Not added"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/70 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">Security</span>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    Managed
                  </span>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-3.5 py-2.5">
                  <p className="mb-1 text-muted-foreground">Primary address</p>
                  <p className="font-medium leading-5">
                    {currentUser?.address ||
                      "No address saved yet. Add one below to speed up checkout."}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <Button
                  nativeButton={false}
                  render={<Link href="/shop" />}
                  size="sm"
                  className="w-full gap-2 sm:w-auto"
                >
                  Browse products
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 sm:w-auto"
                >
                  <Package2 className="size-4" />
                  {ordersList.length} total orders
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Tabs
          defaultValue="orders"
          className="mt-8 gap-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start"
        >
          <div className="min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-24 lg:overflow-visible">
            <TabsList className="inline-grid h-auto min-w-full w-max grid-flow-col auto-cols-[minmax(148px,1fr)] gap-2 rounded-[22px] bg-muted/25 p-1 sm:rounded-[24px] lg:grid lg:w-full lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-1">
              <TabsTrigger
                value="orders"
                className="w-full justify-start whitespace-nowrap rounded-[18px] border border-transparent bg-transparent px-3 py-3 text-sm text-foreground/70 after:hidden hover:bg-background/80 hover:text-foreground data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-[0_10px_30px_-22px_rgba(0,0,0,0.22)] sm:rounded-[20px] sm:px-4 lg:min-w-0"
              >
                <span className="flex size-8 items-center justify-center rounded-2xl bg-muted/55">
                  <Package2 className="size-4" />
                </span>
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="wishlist"
                className="w-full justify-start whitespace-nowrap rounded-[18px] border border-transparent bg-transparent px-3 py-3 text-sm text-foreground/70 after:hidden hover:bg-background/80 hover:text-foreground data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-[0_10px_30px_-22px_rgba(0,0,0,0.22)] sm:rounded-[20px] sm:px-4 lg:min-w-0"
              >
                <span className="flex size-8 items-center justify-center rounded-2xl bg-muted/55">
                  <Heart className="size-4" />
                </span>
                Wishlist
              </TabsTrigger>
              <TabsTrigger
                value="addresses"
                className="w-full justify-start whitespace-nowrap rounded-[18px] border border-transparent bg-transparent px-3 py-3 text-sm text-foreground/70 after:hidden hover:bg-background/80 hover:text-foreground data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-[0_10px_30px_-22px_rgba(0,0,0,0.22)] sm:rounded-[20px] sm:px-4 lg:min-w-0"
              >
                <span className="flex size-8 items-center justify-center rounded-2xl bg-muted/55">
                  <MapPin className="size-4" />
                </span>
                Address
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="w-full justify-start whitespace-nowrap rounded-[18px] border border-transparent bg-transparent px-3 py-3 text-sm text-foreground/70 after:hidden hover:bg-background/80 hover:text-foreground data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-[0_10px_30px_-22px_rgba(0,0,0,0.22)] sm:rounded-[20px] sm:px-4 lg:min-w-0"
              >
                <span className="flex size-8 items-center justify-center rounded-2xl bg-muted/55">
                  <LockKeyhole className="size-4" />
                </span>
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-w-0">
            <TabsContent value="orders" className="mt-0">
              <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-sm sm:rounded-[32px] sm:p-6 xl:p-7">
                <div className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Orders
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Purchase timeline
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      A cleaner view of every order, from status to total, with
                      quick access to details.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {latestOrder
                      ? `Latest order on ${formatDate(latestOrder.createdAt)}`
                      : "No order activity yet"}
                  </div>
                </div>

                {ordersList.length > 0 ? (
                  <div className="space-y-4">
                    {ordersList.map((order) => (
                      <Card
                        key={order.id}
                        className="gap-0 border border-border/60 bg-muted/20 py-0 shadow-none"
                      >
                        <CardHeader className="border-b border-border/60 py-4 sm:py-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                Order #{order.orderNumber}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                Placed on {formatDate(order.createdAt)}
                              </CardDescription>
                            </div>
                            <Badge
                              className={cn(
                                "h-auto rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em]",
                                getStatusClasses(order.status),
                              )}
                              variant="outline"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 py-4 sm:gap-5 sm:py-5 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Items
                            </p>
                            <p className="mt-2 text-base font-semibold">
                              {order.items.length}{" "}
                              {order.items.length === 1 ? "item" : "items"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Total
                            </p>
                            <p className="mt-2 text-base font-semibold">
                              {formatAmount(order.totalAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Next step
                            </p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {order.status === "DELIVERED"
                                ? "Delivered and completed."
                                : "Open details for shipping and timeline updates."}
                            </p>
                          </div>
                          <div className="md:justify-self-end">
                            <Button
                              nativeButton={false}
                              variant="outline"
                              render={<Link href={`/orders/${order.id}`} />}
                              className="w-full gap-2 sm:w-auto"
                            >
                              View details
                              <ArrowUpRight className="size-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Package2}
                    title="No orders yet"
                    description="Once you place an order, it will show up here with its status, totals, and a direct path back to the full receipt."
                    cta={
                      <Button
                        nativeButton={false}
                        render={<Link href="/shop" />}
                      >
                        Start shopping
                      </Button>
                    }
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="wishlist" className="mt-0">
              <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-sm sm:rounded-[32px] sm:p-6 xl:p-7">
                <div className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Wishlist
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Saved for later
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Keep products in orbit until you&apos;re ready to buy.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {wishlistItems.length} saved item
                    {wishlistItems.length === 1 ? "" : "s"}
                  </div>
                </div>

                {wishlistItems.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {wishlistItems.map((item) => (
                      <Card
                        key={item.id}
                        className="gap-0 overflow-hidden border border-border/60 bg-muted/20 py-0 shadow-none"
                      >
                        <CardContent className="grid gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center sm:gap-5">
                          <div className="relative aspect-square overflow-hidden rounded-[22px] bg-muted/50">
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Saved item
                            </p>
                            <h3 className="mt-2 truncate text-lg font-semibold">
                              {item.product.name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatAmount(item.product.price)}
                            </p>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                              <Button
                                nativeButton={false}
                                variant="outline"
                                render={
                                  <Link href={`/shop/${item.product.id}`} />
                                }
                                className="w-full sm:w-auto"
                              >
                                View product
                              </Button>
                              <Button
                                onClick={(e) =>
                                  handleDeleteWishlist(e, item.product.id)
                                }
                                disabled={deletingWishlist}
                                variant="secondary"
                                className="w-full sm:w-auto"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Heart}
                    title="Wishlist is empty"
                    description="Save products you want to revisit. They will stay here until you move them into your cart or remove them."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="addresses" className="mt-0">
              <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-sm sm:rounded-[32px] sm:p-6 xl:p-7">
                <div className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Address
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Delivery details
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Keep shipping info ready so checkout stays fast and
                    predictable.
                  </p>
                </div>

                <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <Card className="border border-border/60 bg-muted/20 shadow-none">
                    <CardHeader>
                      <CardTitle>Default address</CardTitle>
                      <CardDescription>
                        Used to prefill delivery fields during checkout.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form
                          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                          className="space-y-5"
                        >
                          <FormField
                            name="phone"
                            control={profileForm.control}
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FieldLabel>Phone number</FieldLabel>
                                <FormControl>
                                  <Input
                                    placeholder="01XXXXXXXXX"
                                    className="h-11 rounded-2xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="address"
                            control={profileForm.control}
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FieldLabel>Full address</FieldLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="House/Flat, Road, Area, District, City"
                                    rows={4}
                                    className="rounded-2xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isPending}
                              className="w-full gap-2 sm:w-auto"
                            >
                              {isPending && (
                                <Loader2 className="size-4 animate-spin" />
                              )}
                              Save address
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/60 bg-foreground text-background shadow-none">
                    <CardHeader>
                      <CardTitle className="text-background">
                        Delivery readiness
                      </CardTitle>
                      <CardDescription className="text-background/70">
                        Quick summary before your next checkout.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-background/60">
                          Address status
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {hasAddress ? "Saved" : "Needs attention"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-background/60">
                          Contact number
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {currentUser?.phone || "Missing"}
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-background/72">
                        Accurate delivery details reduce failed handoffs and
                        make order updates more reliable.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-sm sm:rounded-[32px] sm:p-6 xl:p-7">
                <div className="mb-6 flex flex-col gap-3 border-b border-border/60 pb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Settings
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Personal info and security
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Update your public details and keep account access secure.
                  </p>
                </div>

                <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
                  <Card className="border border-border/60 bg-muted/20 shadow-none">
                    <CardHeader>
                      <CardTitle>Personal information</CardTitle>
                      <CardDescription>
                        Basic details attached to your customer account.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form
                          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                          className="space-y-5"
                        >
                          <FormField
                            name="name"
                            control={profileForm.control}
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FieldLabel>Full name</FieldLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your full name"
                                    className="h-11 rounded-2xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="space-y-2">
                            <FieldLabel>Email</FieldLabel>
                            <Input
                              value={currentUser?.email ?? ""}
                              disabled
                              className="h-11 cursor-not-allowed rounded-2xl opacity-65"
                            />
                            <p className="text-xs text-muted-foreground">
                              Email cannot be changed from this screen.
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isPending}
                              className="w-full gap-2 sm:w-auto"
                            >
                              {isPending && (
                                <Loader2 className="size-4 animate-spin" />
                              )}
                              Save changes
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/60 bg-muted/20 shadow-none">
                    <CardHeader>
                      <CardTitle>Change password</CardTitle>
                      <CardDescription>
                        Use a strong password you do not reuse elsewhere.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                          className="space-y-5"
                        >
                          <FormField
                            name="currentPassword"
                            control={passwordForm.control}
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FieldLabel>Current password</FieldLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-11 rounded-2xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="newPassword"
                            control={passwordForm.control}
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FieldLabel>New password</FieldLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-11 rounded-2xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="confirmPassword"
                            control={passwordForm.control}
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FieldLabel>Confirm new password</FieldLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-11 rounded-2xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isPending}
                              className="w-full gap-2 sm:w-auto"
                            >
                              {isPending && (
                                <Loader2 className="size-4 animate-spin" />
                              )}
                              Update password
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default AccountClientPage;
