/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/claudyne\.com\/api\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'claudyne-api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60 // 24 heures
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          return request.url;
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'claudyne-images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 jours
        }
      }
    },
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'claudyne-static-resources'
      }
    }
  ]
});

const nextConfig = {
  // Configuration de base
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuration pour le Cameroun et l'optimisation
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr'
  },
  
  // Images optimisées pour les connexions lentes
  images: {
    domains: [
      'api.claudyne.com',
      'cdn.claudyne.com',
      'res.cloudinary.com',
      'localhost'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 heures
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [320, 420, 768, 1024, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configuration spéciale pour 2G/3G
    loader: 'default',
    unoptimized: false
  },
  
  // Compression et optimisations
  compress: true,
  
  // Configuration des headers pour la performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable' // 1 an
          }
        ]
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400' // 24 heures
          }
        ]
      }
    ];
  },
  
  // Configuration des redirections
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/famille',
        permanent: true
      },
      {
        source: '/profile',
        destination: '/famille/profil',
        permanent: true
      }
    ];
  },
  
  // Variables d'environnement exposées côté client
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString()
  },
  
  // Configuration des domaines de confiance
  experimental: {
    // Optimisations expérimentales pour la performance
    optimizeCss: true,
    scrollRestoration: true,
    // Optimisations pour les pays en développement
    largePageDataBytes: 64 * 1024, // 64kb
    adjustFontFallbacks: true
  },
  
  // Configuration du webpack pour les optimisations
  webpack: (config, { dev, isServer }) => {
    // Optimisations pour la production
    if (!dev) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Séparer les dépendances lourdes
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all'
        },
        // Séparer les composants Claudyne
        claudyne: {
          test: /[\\/]components[\\/]/,
          name: 'claudyne-ui',
          priority: 5,
          chunks: 'all'
        }
      };
    }
    
    // Support pour les imports SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    
    // Alias pour simplifier les imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './'),
      '@components': require('path').resolve(__dirname, './components'),
      '@utils': require('path').resolve(__dirname, './utils'),
      '@services': require('path').resolve(__dirname, './services'),
      '@stores': require('path').resolve(__dirname, './stores'),
      '@styles': require('path').resolve(__dirname, './styles'),
      '@types': require('path').resolve(__dirname, './types'),
      '@hooks': require('path').resolve(__dirname, './hooks')
    };
    
    return config;
  },
  
  // Configuration TypeScript stricte
  typescript: {
    ignoreBuildErrors: false
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'components', 'utils', 'services', 'stores']
  },
  
  // Optimisation pour les pays avec connexion lente
  onDemandEntries: {
    maxInactiveAge: 25 * 1000, // 25 secondes
    pagesBufferLength: 2
  },
  
  // Configuration pour l'analyse des bundles
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: '../bundle-analyzer-report.html'
        })
      );
      return config;
    }
  }),
  
  // Configuration du serveur en développement
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right'
    }
  }),
  
  // Configuration de production
  ...(process.env.NODE_ENV === 'production' && {
    // Optimisations de build
    productionBrowserSourceMaps: false,
    optimizeFonts: true
  })
};

// Configuration spécifique pour l'Afrique (connexions lentes)
if (process.env.CLAUDYNE_REGION === 'africa' || process.env.NODE_ENV === 'production') {
  nextConfig.images.formats = ['image/webp']; // Priorité au WebP
  nextConfig.experimental.optimizeCss = true;
}

// Application du plugin PWA
module.exports = withPWA(nextConfig);