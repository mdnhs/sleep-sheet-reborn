"use client";
import { useState } from "react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  };

  //     // Simulate API call
  //     setTimeout(() => {
  //       setIsLoading(false);
  //       toast({
  //         title: "Success!",
  //         description: "You've been subscribed to our newsletter.",
  //       });
  //       setEmail('');
  //     }, 1000);
  //   };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-8 md:text-lg">
            Sign up for our newsletter to receive updates on new product
            releases, exclusive offers, and styling inspiration.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-md border border-input bg-background"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {isLoading ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            By signing up, you agree to our Privacy Policy and Terms of Service.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
