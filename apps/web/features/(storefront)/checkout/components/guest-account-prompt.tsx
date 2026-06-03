"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { useAppSelector } from "@/stores/hooks";

function GuestAccountPrompt() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const shippingInfo = useAppSelector((state) => state.checkout.shippingInfo);
  const email = shippingInfo?.email ?? "";

  if (done) {
    return (
      <p className="text-sm text-green-600 font-medium mt-2">
        Account created! You can log in anytime to track your orders.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-primary hover:underline mt-2"
        type="button"
      >
        Save your details — create a free account
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please provide your email to create an account.");
      return;
    }
    setLoading(true);
    try {
      const res = await client.api.auth.register.$post({
        json: { name: name || (shippingInfo?.fullName ?? "Customer"), email, password },
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error || "Failed to create account");
        return;
      }
      setDone(true);
      toast.success("Account created successfully!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4 p-4 border rounded-lg bg-muted/30">
      <p className="text-sm font-medium">Create a free account to track your orders</p>
      {!email && (
        <Input
          type="email"
          placeholder="your@email.com"
          required
          value=""
          readOnly
          disabled
        />
      )}
      {email && (
        <p className="text-sm text-muted-foreground">Email: <span className="font-medium">{email}</span></p>
      )}
      <Input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Choose a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading || !email}>
          {loading ? "Creating..." : "Create Account"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {!email && (
        <p className="text-xs text-muted-foreground">
          Go back and add your email to create an account.
        </p>
      )}
    </form>
  );
}

export default GuestAccountPrompt;
