const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Next.js bundle size and performance...\n');

try {
  // Install bundle analyzer if not present
  try {
    require('@next/bundle-analyzer');
  } catch (e) {
    console.log('📦 Installing bundle analyzer...');
    execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
  }

  // Create optimized next config for analysis
  const configContent = `
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your existing config
  experimental: {
    optimizePackageImports: [
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons',
      'lucide-react',
      'framer-motion'
    ],
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Analyze bundle size
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },
});
`;

  // Write analysis config
  fs.writeFileSync('next.config.analysis.js', configContent);
  
  console.log('📊 Building for analysis...');
  execSync('ANALYZE=true next build', { stdio: 'inherit' });
  
  console.log('\n✅ Analysis complete! Check the browser for bundle visualization.');
  
} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  
  // Fallback: Basic size check
  console.log('\n📏 Checking basic project size...');
  
  const getDirectorySize = (dirPath) => {
    let size = 0;
    try {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      });
    } catch (e) {
      // Directory doesn't exist
    }
    return size;
  };
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const srcSize = getDirectorySize('./src');
  const nodeModulesSize = getDirectorySize('./node_modules');
  
  console.log(`📁 Source code size: ${formatBytes(srcSize)}`);
  console.log(`📦 Node modules size: ${formatBytes(nodeModulesSize)}`);
  
  // Performance tips
  console.log('\n💡 Performance Tips:');
  console.log('1. Use next/dynamic for code splitting');
  console.log('2. Optimize images with next/image');
  console.log('3. Lazy load heavy components');
  console.log('4. Use React.memo for expensive components');
  console.log('5. Check for console.logs in production');
}

// Cleanup
try {
  fs.unlinkSync('next.config.analysis.js');
} catch (e) {
  // File doesn't exist
}

