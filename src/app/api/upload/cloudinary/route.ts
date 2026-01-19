import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { uploadImage } from '@/config/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  try {
    // Kiểm tra API keys với logging chi tiết
    const hasCloudName = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

    console.log('Cloudinary Config Check:', {
      hasCloudName,
      hasApiKey,
      hasApiSecret,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING',
    });

    if (!hasCloudName) {
      return NextResponse.json(
        { 
          error: 'Cloudinary Cloud Name is not configured',
          message: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing. Please check your .env.local file and restart the dev server.'
        },
        { status: 500 }
      );
    }

    if (!hasApiKey || !hasApiSecret) {
      return NextResponse.json(
        { 
          error: 'Cloudinary API keys are not configured',
          message: 'CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is missing. Please check your .env.local file and restart the dev server.'
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string | null;
    const publicId = formData.get('publicId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    console.log('Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder: folder || 'none',
    });

    const result = await uploadImage(file, {
      folder: folder || undefined,
      publicId: publicId || undefined,
      resourceType: 'image',
    });

    console.log('Upload successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Cloudinary upload API error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      http_code: error.http_code,
    });
    
    // Trả về thông báo lỗi chi tiết hơn
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = error.response?.data || error.http_code 
      ? `Cloudinary error: ${JSON.stringify(error.response?.data || { http_code: error.http_code })}`
      : errorMessage;

    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        message: errorDetails,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'publicId is required' },
        { status: 400 }
      );
    }

    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json(
      { message: 'Image deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cloudinary delete API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete image',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

