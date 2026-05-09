"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import {
  Form,
  FormItem,
  FormField,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { z } from "zod";
import Link from "next/link";
import { LoginSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../api/use-login";

function SignInCard() {
  const { mutate, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = (value: z.infer<typeof LoginSchema>) => {
    mutate({ json: value });
  };

  return (
    <Card className=" w-full">
      <CardHeader>
        <CardTitle className=" text-center">
          <h1 className=" text-2xl font-bold text-center mb-2">Sign In</h1>
        </CardTitle>
        <p className=" text-muted-foreground text-center">
          Welcome back! Sign in to your account to continue shopping.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className=" space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className=" text-sm font-semibold">
                    Email Address
                  </label>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email"
                      {...field}
                      className="w-full "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className=" text-sm font-semibold">Password</label>
                  <div className=" relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...field}
                        className="w-full "
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className=" flex justify-between items-center">
              <label className=" flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Remember me
                </span>
              </label>
              <Link href={"/forgot-password"}>
                <span className=" text-sm text-primary font-bold cursor-pointer">
                  Forgot Password?
                </span>
              </Link>
            </div>
            <Button type="submit" size="lg" className=" w-full" disabled={isPending}>
              Login
            </Button>
          </form>
        </Form>
        <p className=" text-md text-muted-foreground text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link href={"/signup"}>
            <span className=" text-primary font-bold cursor-pointer">
              Create Account
            </span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default SignInCard;
