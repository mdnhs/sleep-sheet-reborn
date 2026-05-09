"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { Trash } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCreateCategories } from "@/features/categories/api/use-create-categories";
import { useDeleteCategory } from "@/features/categories/api/use-delete-category";
import { DeleteAlertMessage } from "@/components/DeleteAlertMessage";

function CategoriesClientPage() {
  const { data: categories, isLoading } = useGetCategories();
  const { mutate, isPending: isCreatingCatogory } = useCreateCategories();
  const { mutate: deleteCategory, isPending: isCategoryLoading } =
    useDeleteCategory();

  const [categoryName, setCategoryName] = React.useState("");
  const [categoryValue, setCategoryValue] = React.useState("");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ label: categoryName, value: categoryValue });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="pb-4">
        <h1 className="text-3xl font-bold text-foreground">Category Manager</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Category Form */}
        <Card className="lg:col-span-1 h-[200px]">
          <CardHeader>
            <CardTitle>Create New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                placeholder="Category Name"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);

                  setCategoryValue(generateSlug(e.target.value));
                }}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isCreatingCatogory}
              >
                Create Category
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories?.map((category) => (
                    <div
                      key={category.value}
                      className={cn(
                        "group relative bg-card rounded-lg p-4",
                        "transition-all hover:bg-accent hover:translate-x-1",
                        "border"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {category.label}
                          </p>
                        </div>
                        <DeleteAlertMessage
                          description={`This Action Will Delete  ${category.label} Category Permanently`}
                          loading={isCategoryLoading}
                          onConfirm={() => {
                            deleteCategory({ value: category.value });
                          }}
                        >
                          <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-full"
                          >
                            <Trash className="w-4 h-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </DeleteAlertMessage>
                      </div>
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

export default CategoriesClientPage;
