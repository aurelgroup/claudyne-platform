/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      // Couleurs du thème Claudyne inspirées du drapeau camerounais
      colors: {
        // Couleurs principales (drapeau camerounais)
        primary: {
          green: '#009639',
          red: '#CE1126',
          yellow: '#FCDD09'
        },
        
        // Couleurs d'accent
        accent: {
          blue: '#2E86C1',
          purple: '#8E44AD',
          orange: '#E67E22'
        },
        
        // Couleurs Prix Claudine
        claudine: {
          gold: '#D4AF37',
          bronze: '#CD7F32',
          silver: '#C0C0C0'
        },
        
        // Couleurs neutres
        neutral: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#1A1A1A',
          dark: '#2C3E50',
          light: '#F8F9FA'
        },
        
        // Couleurs fonctionnelles
        success: '#27AE60',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB',
        
        // Couleurs spécifiques Claudyne
        mentor: {
          primary: '#8E44AD',
          secondary: '#D4AF37'
        },
        battle: {
          active: '#E74C3C',
          winner: '#27AE60',
          participant: '#3498DB'
        },
        family: {
          parent: '#2E86C1',
          child: '#E67E22',
          manager: '#27AE60'
        }
      },
      
      // Espacement cohérent
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      
      // Typographie adaptée au français
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
        serif: [
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif'
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'Consolas',
          'monospace'
        ]
      },
      
      // Tailles de police
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      
      // Rayons de bordure
      borderRadius: {
        'sm': '0.5rem',
        'DEFAULT': '0.75rem',
        'md': '0.875rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem'
      },
      
      // Ombres personnalisées
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'DEFAULT': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'md': '0 8px 16px rgba(0, 0, 0, 0.15)',
        'lg': '0 16px 32px rgba(0, 0, 0, 0.2)',
        'claudine': '0 8px 25px rgba(212, 175, 55, 0.3)',
        'battle': '0 8px 25px rgba(231, 76, 60, 0.3)',
        'family': '0 8px 25px rgba(46, 134, 193, 0.3)'
      },
      
      // Animations et transitions
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'sparkle': 'sparkle 2s ease-in-out infinite'
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' }
        }
      },
      
      // Grilles responsives
      gridTemplateColumns: {
        'auto-fit-xs': 'repeat(auto-fit, minmax(150px, 1fr))',
        'auto-fit-sm': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-md': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(300px, 1fr))'
      },
      
      // Breakpoints personnalisés pour les appareils camerounais
      screens: {
        'xs': '375px',    // Petits téléphones
        'sm': '640px',    // Téléphones moyens
        'md': '768px',    // Tablettes
        'lg': '1024px',   // Petits ordinateurs portables
        'xl': '1280px',   // Ordinateurs de bureau
        '2xl': '1536px',  // Grands écrans
        // Breakpoints spécifiques
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px' }
      },
      
      // Gradients personnalisés
      backgroundImage: {
        'claudine-gradient': 'linear-gradient(45deg, #D4AF37, #8E44AD)',
        'cameroon-gradient': 'linear-gradient(135deg, #009639, #CE1126, #FCDD09)',
        'battle-gradient': 'linear-gradient(135deg, #CE1126, #FF8E53)',
        'success-gradient': 'linear-gradient(135deg, #27AE60, #2ECC71)',
        'mentor-gradient': 'linear-gradient(135deg, #8E44AD, #9B59B6)',
        'family-gradient': 'linear-gradient(135deg, #2E86C1, #3498DB)'
      },
      
      // Variables CSS personnalisées
      variables: {
        '--header-height': '80px',
        '--sidebar-width': '280px',
        '--mobile-sidebar-width': '100%',
        '--max-content-width': '1400px'
      }
    }
  },
  
  // Plugins Tailwind utiles
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Plugin personnalisé pour les composants Claudyne
    function({ addComponents, theme }) {
      addComponents({
        '.btn-claudine': {
          background: theme('backgroundImage.claudine-gradient'),
          color: theme('colors.white'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.semibold'),
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.claudine')
          }
        },
        
        '.btn-cameroon': {
          background: theme('backgroundImage.cameroon-gradient'),
          color: theme('colors.white'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.semibold')
        },
        
        '.card-claudyne': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.md'),
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme('boxShadow.lg')
          }
        },
        
        '.text-gradient-claudine': {
          background: theme('backgroundImage.claudine-gradient'),
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent'
        },
        
        '.avatar-claudyne': {
          width: theme('spacing.12'),
          height: theme('spacing.12'),
          borderRadius: theme('borderRadius.full'),
          background: theme('backgroundImage.claudine-gradient'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme('colors.white'),
          fontSize: theme('fontSize.xl'),
          border: `4px solid ${theme('colors.white')}`
        },
        
        '.progress-bar-claudine': {
          width: '100%',
          height: theme('spacing.2'),
          backgroundColor: theme('colors.neutral.200'),
          borderRadius: theme('borderRadius.full'),
          overflow: 'hidden',
          '& .progress-fill': {
            height: '100%',
            background: theme('backgroundImage.claudine-gradient'),
            borderRadius: theme('borderRadius.full'),
            transition: 'width 0.5s ease'
          }
        }
      });
    },
    
    // Plugin pour les utilitaires personnalisés
    function({ addUtilities, theme }) {
      addUtilities({
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
        },
        '.text-shadow-lg': {
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)'
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme('colors.neutral.400'),
            borderRadius: theme('borderRadius.full')
          }
        }
      });
    }
  ],
  
  // Mode dark désactivé par défaut (sera géré manuellement)
  darkMode: 'class'
};