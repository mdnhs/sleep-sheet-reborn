import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface useCreateCategoriesProps{
    value:string,
    label:string;
    parentId?: string | null;
    image?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
}
export const useCreateCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({value,label,parentId,image,seoTitle,seoDescription}:useCreateCategoriesProps) => {
      const response = await client.api.categories.create.$post({
        json: {
          value,
          label,
          parentId: parentId ?? null,
          image: image ?? null,
          seoTitle: seoTitle ?? null,
          seoDescription: seoDescription ?? null,
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }
      return response.json();

    },
    onSuccess: () => {
      toast.success('Categories created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};