"use client";
import { useState } from "react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  };

  return (
    <section className="bg-foreground text-background py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-background/40">
            Newsletter
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-light mt-4 mb-4 text-background">
            Stay in the know.
          </h2>
          <p className="text-background/50 mb-10 text-sm leading-relaxed max-w-sm mx-auto">
            New arrivals, exclusive offers, and styling inspiration — delivered
            to your inbox.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row w-full max-w-md mx-auto border border-background/20"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 px-5 py-4 bg-transparent text-background placeholder:text-background/30 text-sm outline-none border-b sm:border-b-0 sm:border-r border-background/20"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-7 py-4 bg-primary text-primary-foreground text-xs font-medium uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {isLoading ? "Subscribing…" : "Subscribe"}
            </button>
          </form>

          <p className="text-xs text-background/25 mt-6">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
