import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/rpc';

export const useGetPosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await client.api.blog.$get();
      if (!response.ok) throw new Error('Failed to fetch posts');
      const { posts } = await response.json();
      return posts;
    },
  });
};
