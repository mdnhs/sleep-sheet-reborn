import React from 'react';
import UpdateBlogClient from './update-blog-client';

export const metadata = {
  title: 'Update Blog Post',
};

export default function UpdateBlogPage({ params }: { params: { id: string } }) {
  return <UpdateBlogClient id={params.id} />;
}
