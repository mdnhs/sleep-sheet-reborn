"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Package, Save, Settings } from "lucide-react";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema } from "@/features/dashboard/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ChipsInput } from "@/components/chip-input";
import { FileUpload } from "@/features/dashboard/components/file-upload";
import { SpecificationFields } from "@/features/dashboard/components/specifications-fields";
import { VariantFields } from "@/features/dashboard/components/variant-fields";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useGetProduct } from "@/features/product/api/use-get-product";
import { useUpdateProduct } from "@/features/dashboard/api/use-update-product";
import { useProductId } from "@/features/product/hooks/use-product-id";

function UpdateProductClient() {
  const router = useRouter();
  const id = useProductId();

  const { data: product, isLoading: productLoading } = useGetProduct({
    id,
  });
  const { mutate } = useUpdateProduct();

  const { data: categories, isLoading: categoryLoading } = useGetCategories();

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: {
      productName: "",
      productDescription: "",
      productPrice: 0,
      productStock: 0,
      productCategory: "",
      productSKU: "",
      productVariants: [],
      productImages: [],
      productTags: [],
      productSize: [],
      specifications: [
        { key: "Material", value: "" },
        { key: "Weight", value: "" },
        { key: "Origin", value: "" },
      ],
      productFeatures: [],
      careInstructions: "",
      isFeatured: false,
      discount: 0,
      defaultVariantName: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        productName: product.name,
        productDescription: product.description,
        productPrice: product.price,
        productStock: product.stock,
        productCategory: product.category,
        productSKU: product.sku,
        productVariants: product.colors || [],
        productImages: product.images,
        productTags: product.tags,
        productSize: product.sizes,
        specifications: product.specifications,
        productFeatures: product.features,
        careInstructions: product.care,
        isFeatured: product.isFeatured,
        discount: product.discount || 0,
        defaultVariantName: product.defaultVariantName || "",
      });
    }
  }, [product, form]);

  type ProductFormValues = z.infer<typeof ProductSchema>;

  const onSubmit = async (values: ProductFormValues) => {
    const formData = new FormData();
    formData.append("id", id as string);
    formData.append("productName", values.productName);
    formData.append("productDescription", values.productDescription);
    formData.append("productPrice", values.productPrice.toString());
    formData.append("productStock", values.productStock.toString());
    formData.append("productCategory", values.productCategory);
    formData.append("productSKU", values.productSKU);
    formData.append("productVariants", JSON.stringify(values.productVariants || []));
    formData.append("productTags", JSON.stringify(values.productTags || []));
    formData.append("specifications", JSON.stringify(values.specifications || []));
    formData.append("productSize", JSON.stringify(values.productSize || []));
    formData.append("productFeature", JSON.stringify(values.productFeatures || []));
    formData.append("careInstruction", values.careInstructions || "");
    formData.append("isFeatured", values.isFeatured ? "true" : "false");
    formData.append("discount", (values.discount || 0).toString());
    formData.append("defaultVariantName", values.defaultVariantName || "");

    values.productImages.forEach((file) => {
      if (file instanceof File) {
        formData.append("productImages", file);
      } else {
        formData.append("productImages", file);
      }
    });

    mutate(formData, {
      onSuccess: () => {
        router.push("/dashboard/products");
      },
    });
  };

  if (productLoading && categoryLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Update Product</h1>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("Validation Errors:", errors))}>
          <div className="flex flex-col gap-6 lg:flex-row">
            <Card className="w-full lg:w-2/3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Package size={24} />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  name="productName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Product Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Product Name"
                          required
                          {...field}
                          className="w-full mb-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="productDescription"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Product Description
                      </FormLabel>
                      <FormControl>
                        <TiptapEditor
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <FormField
                    name="productPrice"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className=" w-full">
                        <FormLabel className="text-sm font-semibold">
                          Product Price
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            required
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="discount"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className=" w-full">
                        <FormLabel className="text-sm font-semibold">
                          Discount Percentage (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="productStock"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className=" w-full">
                        <FormLabel className="text-sm font-semibold">
                          Product Stock
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            required
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="productSKU"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-semibold">
                        SKU (Stock Keeping Unit)
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="text"
                            placeholder="Enter product SKU"
                            required
                            {...field}
                            className="w-full"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const sku = Math.random().toString(36).substring(2, 8).toUpperCase();
                              form.setValue("productSKU", sku, { shouldValidate: true });
                            }}
                          >
                            Auto Generate
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="w-full">
                    <VariantFields control={form.control as any} setValue={form.setValue} />
                  </div>

                  <FormField
                    name="productTags"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className=" w-full">
                        <FormLabel className="block text-sm font-semibold ">
                          Tags
                        </FormLabel>
                        <FormControl>
                          <ChipsInput
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder="Add tags (press Enter or comma)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="productFeatures"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className=" w-full">
                      <FormLabel className="block text-sm font-semibold ">
                        Product Features
                      </FormLabel>
                      <FormControl>
                        <ChipsInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add Features (press Enter or comma)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="careInstructions"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold mt-4">
                        Care Instruction (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder=" Care Instruction"
                          required
                          {...field}
                          className="w-full mb-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="isFeatured"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 mt-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-semibold inline-block">
                        Mark as Featured Product (optional)
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("productVariants") && form.watch("productVariants")!.length > 0 && (
                  <FormField
                    name="defaultVariantName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel className="block text-sm font-semibold mb-1">
                          Default Variant Price to Display
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full h-10 border border-input rounded-xl px-3 bg-white dark:bg-slate-900">
                              <SelectValue placeholder="Select default variant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None (Use base product price)</SelectItem>
                            {form.watch("productVariants")?.map((variant) => (
                              <SelectItem key={variant.name} value={variant.name}>
                                {variant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Product Settings Card */}
            <Card className="w-full lg:w-1/3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Settings size={24} />
                  Product Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  name="productCategory"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-semibold mb-2">
                        Category
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select categories" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem
                                key={category.label}
                                value={category.value}
                              >
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="productSize"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className=" w-full">
                      <FormLabel className="block text-sm font-semibold mt-4">
                        Product size (optional)
                      </FormLabel>
                      <FormControl>
                        <ChipsInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add Product Size (press Enter or comma)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SpecificationFields
                  control={form.control}
                  setValue={form.setValue}
                />
                <FormField
                  name="productImages"
                  control={form.control}
                  render={() => (
                    <>
                      <FormLabel className="block text-sm font-semibold my-4">
                        Upload
                      </FormLabel>
                      <FileUpload form={form} name="productImages" />
                    </>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="  flex flex-col lg:flex-row gap-y-4 lg:justify-end mt-6">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full lg:w-[120px] mr-4"
              onClick={() => form.reset()}
            >
              Clear
            </Button>

            <Button type="submit" size="lg" className=" w-full lg:w-[120px]">
              <Save />
              Update
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default UpdateProductClient;
