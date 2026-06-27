import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { client } from '@/lib/rpc';

interface BlogQueryParams {
  page?: string;
  search?: string;
  limit?: string;
}

export const useGetPosts = (params?: BlogQueryParams) => {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async () => {
      const response = await client.api.blog.$get({
        query: params,
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });
};
