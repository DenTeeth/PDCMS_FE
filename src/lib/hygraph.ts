import { GraphQLClient, gql } from 'graphql-request';

const endpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT;

if (!endpoint) {
  throw new Error('NEXT_PUBLIC_HYGRAPH_ENDPOINT is not defined in environment variables');
}

export const hygraph = new GraphQLClient(endpoint);

// Query to get all posts
export const GET_POSTS_QUERY = gql`
  query GetPosts {
    posts {
      id
      title
      slug
      updatedAt
      author
      coverImage {
        url
      }
    }
  }
`;

// Query to get a single post by slug
export const GET_POST_BY_SLUG_QUERY = gql`
  query GetPostBySlug($slug: String!) {
    post(where: { slug: $slug }) {
      id
      title
      slug
      updatedAt
      author
      content {
        html
      }
      coverImage {
        url
      }
    }
  }
`;

// Type definitions for TypeScript
export interface Post {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  author?: string; // Author is a String field, not an object
  content?: {
    html: string;
  };
  coverImage?: {
    url: string;
  };
}

export interface PostsResponse {
  posts: Post[];
}

export interface PostResponse {
  post: Post | null;
}

