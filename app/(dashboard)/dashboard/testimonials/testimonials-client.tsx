"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTestimonials } from "@/features/testimonials/api/use-get-testimonials";
import { useCreateTestimonial } from "@/features/testimonials/api/use-create-testimonial";
import { useDeleteTestimonial } from "@/features/testimonials/api/use-delete-testimonial";
import { Trash } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAlertMessage } from "@/components/DeleteAlertMessage";
import FileUpload from "@/features/dashboard/components/file-upload";

function TestimonialsClientPage() {
  const { data, isLoading } = useGetTestimonials();
  const { mutate: createTestimonial, isPending: isCreating } = useCreateTestimonial();
  const { mutate: deleteTestimonial, isPending: isDeleting } = useDeleteTestimonial();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState("5");
  const [screenshot, setScreenshot] = useState("");

  const testimonials = data?.testimonials || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTestimonial(
      {
        name,
        message,
        rating: parseInt(rating, 10),
        screenshot,
      },
      {
        onSuccess: () => {
          setName("");
          setMessage("");
          setRating("5");
          setScreenshot("");
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="pb-4">
        <h1 className="text-3xl font-bold text-foreground">Testimonials Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage customer reviews and custom screenshots from platforms like Facebook Messenger.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Testimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Customer Name</label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Rating (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Message (Optional if using screenshot)</label>
                <Textarea
                  placeholder="Great product!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Screenshot Image</label>
                <FileUpload
                  endpoint="productImage"
                  value={screenshot ? [screenshot] : []}
                  onChange={(url) => setScreenshot(url[0] || "")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Adding..." : "Add Testimonial"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Testimonials
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({testimonials.length} total)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : testimonials.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No testimonials found. Add one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {testimonials.map((testimonial: any) => (
                    <div
                      key={testimonial.id}
                      className="flex items-start justify-between rounded-lg p-4 border transition-all hover:bg-accent bg-card"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                          <span className="text-xs bg-muted px-2 rounded-full text-muted-foreground">
                            {testimonial.rating} Stars
                          </span>
                        </div>
                        {testimonial.message && (
                          <p className="text-xs text-muted-foreground truncate">{testimonial.message}</p>
                        )}
                        {testimonial.screenshot && (
                          <span className="text-xs text-primary font-medium">Has Screenshot Attachment</span>
                        )}
                      </div>
                      <DeleteAlertMessage
                        description={`This will permanently delete the testimonial from ${testimonial.name}.`}
                        loading={isDeleting}
                        onConfirm={() => deleteTestimonial(testimonial.id)}
                      >
                        <Button variant="destructive" size="icon" className="rounded-full h-8 w-8 shrink-0">
                          <Trash className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </DeleteAlertMessage>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TestimonialsClientPage;
