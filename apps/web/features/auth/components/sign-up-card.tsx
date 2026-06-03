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
import { RegisterSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "../api/user-register";
import { useDispatch } from "react-redux";
import { setRegisterData } from "../state/register-slice";
import { useRouter } from "next/navigation";
import { OTPType } from "../state/forgot-password-slice";

function SignUpCard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { mutate, isPending } = useRegister();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const onSubmit = (value: z.infer<typeof RegisterSchema>) => {
    dispatch(
      setRegisterData({
        ...value,
        purpose: OTPType.EMAIL_VERIFICATION,
      })
    );
    router.push("/verify");
  };

  return (
    <Card className=" w-full">
      <CardHeader>
        <CardTitle className=" text-center">
          <h1 className=" text-2xl font-bold text-center mb-2">Sign Up</h1>
        </CardTitle>
        <p className=" text-muted-foreground text-center">
          Join us and enjoy exclusive benefits and personalized shopping.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className=" space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className=" text-sm font-semibold">Username</label>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="User Name"
                      {...field}
                      className="w-full "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

            <Button type="submit" size="lg" className=" w-full mt-2" disabled={isPending}>
              Create Account
            </Button>
          </form>
        </Form>
        <p className=" text-md text-muted-foreground text-center mt-4">
          Already have an account?{" "}
          <Link href={"/signin"}>
            <span className=" text-primary font-bold cursor-pointer">
              Sign In
            </span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default SignUpCard;
