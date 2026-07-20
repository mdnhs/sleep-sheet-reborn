"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, User, BookOpen } from "lucide-react";
import { useGetPosts } from "@/features/blog/api/use-get-posts";
import { formatDate, getOptimizedImageUrl } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import Autoplay from "embla-carousel-autoplay";

export default function BlogCarousel() {
  const { data: postsData, isLoading } = useGetPosts({ limit: "10" });

  const publishedPosts = postsData?.data?.filter((post: any) => post.isPublished !== false) || [];

  if (isLoading) {
    return (
      <section className="py-8 md:py-12 bg-background border-t border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-row items-end justify-between mb-8">
            <div>
              <Skeleton className="h-4 w-28 rounded-full mb-2" />
              <Skeleton className="h-7 w-48 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
                <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
                <Skeleton className="h-4 w-1/3 rounded-full mt-1" />
                <Skeleton className="h-6 w-3/4 rounded-xl" />
                <Skeleton className="h-4 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (publishedPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 bg-slate-50/50 dark:bg-muted/20 border-t border-slate-100 dark:border-slate-800/80">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full mb-2">
              <BookOpen className="h-3 w-3" />
              Sleep Journal & Guides
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Latest News & Articles
            </h2>
          </div>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4500,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full relative group/carousel"
        >
          <CarouselContent className="-ml-4">
            {publishedPosts.map((post: any) => (
              <CarouselItem
                key={post.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <Link
                  href={`/blog/${post.slug || post.id}`}
                  className="group flex flex-col h-full rounded-3xl bg-white dark:bg-card border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {post.coverImage ? (
                      <Image
                        src={getOptimizedImageUrl(post.coverImage, 600)}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={75}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
                        <BookOpen className="h-10 w-10 opacity-40" />
                      </div>
                    )}
                    {post.createdAt && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Calendar className="h-3 w-3 text-indigo-400" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Post Details */}
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-heading text-base sm:text-lg font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      {post.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {post.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-medium">
                      {post.author?.name ? (
                        <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{post.author.name}</span>
                        </span>
                      ) : (
                        <span>Read article</span>
                      )}
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        Read More
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Controls */}
          <div className="hidden sm:block">
            <CarouselPrevious className="-left-4 lg:-left-5 h-9 w-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
            <CarouselNext className="-right-4 lg:-right-5 h-9 w-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
