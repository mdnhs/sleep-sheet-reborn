"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetOrder } from "@/features/order/api/use-get-order";
import { useDeleteFromWishlist } from "@/features/wishlist/api/use-delete-from-wishlist";
import { useWishlist } from "@/features/wishlist/api/use-wishlist";
import { useCurrent } from "@/features/auth/api/use-current";
import { useUpdateProfile } from "@/features/auth/api/use-update-profile";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

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

function AccountClientPage({ name }: AccountClientPageProps) {
  const { data: orders } = useGetOrder();
  const { data: wishlist } = useWishlist();
  const { data: currentUser } = useCurrent();
  const { formatAmount } = useCurrency();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const { mutate: deleteWishlist, isPending: deletingWishlist } = useDeleteFromWishlist();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
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
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => passwordForm.reset() }
    );
  };

  const handleDeleteWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteWishlist({ productId: id });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl font-bold leading-[150%]">My Account</h1>
      <p className="mt-2">Welcome Back, {name}</p>

      <Tabs defaultValue="orders" className="mt-8 w-full">
        <div className="border-b mb-8 w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
            <TabsTrigger value="wishlist" className="flex-1">Wishlist</TabsTrigger>
            <TabsTrigger value="addresses" className="flex-1">Address</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Account Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Orders */}
        <TabsContent value="orders">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <h2 className="text-xl font-semibold mb-4 md:mb-0">Order History</h2>
              <div className="flex space-x-2">
                <select className="border border-input rounded-md px-3 py-2 bg-background text-sm">
                  <option>All Orders</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                </select>
              </div>
            </div>

            {(orders?.order ?? []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="text-left">
                      <th className="py-3 px-4 font-medium">Order #</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Items</th>
                      <th className="py-3 px-4 font-medium">Total</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders?.order.map((order) => (
                      <tr key={order.id}>
                        <td className="py-4 px-4">{order.orderNumber}</td>
                        <td className="py-4 px-4">{formatDate(order.createdAt)}</td>
                        <td className="py-4 px-4">{order.items.length} items</td>
                        <td className="py-4 px-4">{formatAmount(order.totalAmount)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === "DELIVERED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven&apos;t placed any orders yet.</p>
                <Link href="/products" className="text-primary hover:text-primary/80 transition-colors">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Wishlist */}
        <TabsContent value="wishlist">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">My Wishlist</h2>
            {(wishlist?.items ?? []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wishlist?.items.map((item) => (
                  <Link href={`/products/${item.product.id}`} key={item.id}>
                    <div className="flex border border-border rounded-md p-4">
                      <div className="relative h-24 w-24">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                      </div>
                      <div className="ml-4 flex flex-col flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-muted-foreground mb-2">{formatAmount(item.product.price)}</p>
                        <div className="mt-auto flex space-x-2">
                          <Button
                            onClick={(e) => handleDeleteWishlist(e, item.product.id)}
                            disabled={deletingWishlist}
                            className="px-3 cursor-pointer py-1 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/90 transition-colors"
                          >
                            Remove from Wishlist
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Address */}
        <TabsContent value="addresses">
          <div className="max-w-lg space-y-6">
            <h2 className="text-xl font-semibold">Delivery Address</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Default Address</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      name="phone"
                      control={profileForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-semibold">Phone Number</label>
                          <FormControl>
                            <Input placeholder="01XXXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="address"
                      control={profileForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-semibold">Full Address</label>
                          <FormControl>
                            <Textarea
                              placeholder="House/Flat, Road, Area, District, City"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Address
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="settings">
          <div className="max-w-lg space-y-6">
            <h2 className="text-xl font-semibold">Account Settings</h2>

            {/* Profile info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      name="name"
                      control={profileForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-semibold">Full Name</label>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <label className="text-sm font-semibold">Email</label>
                      <Input
                        value={currentUser?.email ?? ""}
                        disabled
                        className="mt-1 opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Change password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      name="currentPassword"
                      control={passwordForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-semibold">Current Password</label>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="newPassword"
                      control={passwordForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-semibold">New Password</label>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="confirmPassword"
                      control={passwordForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-semibold">Confirm New Password</label>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AccountClientPage;
