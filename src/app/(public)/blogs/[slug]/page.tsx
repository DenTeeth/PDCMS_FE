import { hygraph, GET_POST_BY_SLUG_QUERY, type Post } from '@/lib/hygraph';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const data = await hygraph.request<{ post: Post | null }>(GET_POST_BY_SLUG_QUERY, {
      slug,
    });
    return data.post;
  } catch (error) {
    console.error('Error fetching post from Hygraph:', error);
    return null;
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/blogs"
          className="inline-flex items-center text-[#8b5fbf] hover:text-[#7a4eae] font-medium transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách bài viết
        </Link>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Cover Image */}
        {post.coverImage?.url && (
          <div className="relative h-96 w-full rounded-xl overflow-hidden mb-8 bg-gray-200">
            <Image
              src={post.coverImage.url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              className="object-cover"
              priority
              loading="eager"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* Author and Updated Date */}
        {(post.author || post.updatedAt) && (
          <div className="flex items-center gap-3 mb-6 text-gray-600">
            {post.author && (
              <>
                <span className="font-medium">{post.author}</span>
                <span>•</span>
              </>
            )}
            {post.updatedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Cập nhật: {new Date(post.updatedAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {post.content && (
        <div
          className="blog-content text-gray-700 leading-relaxed
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
            [&_p]:mb-4 [&_p]:text-gray-700
            [&_a]:text-[#8b5fbf] [&_a]:underline [&_a]:hover:text-[#7a4eae]
            [&_strong]:font-semibold [&_strong]:text-gray-900
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:space-y-2
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:space-y-2
            [&_li]:text-gray-700
            [&_img]:rounded-lg [&_img]:shadow-md [&_img]:my-6 [&_img]:w-full [&_img]:h-auto
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#8b5fbf] [&_blockquote]:bg-gray-50 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:my-4 [&_blockquote]:italic
            [&_code]:text-[#8b5fbf] [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
            [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4"
          dangerouslySetInnerHTML={{ __html: post.content.html }}
        />
        )}
      </article>

      {/* Back to Blogs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Link
          href="/blogs"
          className="inline-flex items-center text-[#8b5fbf] hover:text-[#7a4eae] font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách bài viết
        </Link>
      </div>

      <Footer />
    </div>
  );
}

// Generate static params for better performance (optional)
export async function generateStaticParams() {
  try {
    const { hygraph, GET_POSTS_QUERY } = await import('@/lib/hygraph');
    const data = await hygraph.request<{ posts: Array<{ slug: string }> }>(GET_POSTS_QUERY);
    
    return data.posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

