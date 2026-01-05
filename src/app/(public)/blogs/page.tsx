import { hygraph, GET_POSTS_QUERY, type Post } from '@/lib/hygraph';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';

async function getPosts(): Promise<Post[]> {
  try {
    const data = await hygraph.request<{ posts: Post[] }>(GET_POSTS_QUERY);
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching posts from Hygraph:', error);
    return [];
  }
}

export default async function BlogsPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#8b5fbf]/10 to-[#1e3a5f]/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Blog & Tin Tức
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cập nhật những thông tin mới nhất về nha khoa, sức khỏe răng miệng và các dịch vụ của chúng tôi
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có bài viết nào
              </h3>
              <p className="text-gray-500">
                Các bài viết sẽ được hiển thị tại đây khi có nội dung mới.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blogs/${post.slug}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Cover Image */}
                  {post.coverImage?.url && (
                    <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                      <Image
                        src={post.coverImage.url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#8b5fbf] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    
                    {/* Excerpt from HTML content */}
                    <div
                      className="text-gray-600 text-sm mb-4 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: post.content.html
                          .replace(/<[^>]*>/g, '')
                          .substring(0, 150) + '...'
                      }}
                    />
                    
                    {/* Read More */}
                    <div className="flex items-center text-[#8b5fbf] font-medium text-sm group-hover:gap-2 transition-all">
                      <span>Đọc thêm</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

