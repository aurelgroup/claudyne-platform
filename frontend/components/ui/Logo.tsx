/**
 * Composant Logo Claudyne
 * Logo officiel avec variations de taille
 */

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export default function Logo({ 
  size = 'md', 
  className = '', 
  animated = false 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-2xl',
    md: 'w-12 h-12 text-3xl',
    lg: 'w-16 h-16 text-4xl',
    xl: 'w-24 h-24 text-6xl'
  };

  const logoContent = (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      {/* Logo simple avec icône éducative */}
      <div className="relative">
        <div className="bg-gradient-to-br from-primary-green via-accent-purple to-claudine-gold rounded-xl p-2 shadow-lg">
          <div className="text-white font-bold">
            🎓
          </div>
        </div>
        {size === 'lg' || size === 'xl' ? (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-claudine-gold rounded-full flex items-center justify-center">
            <span className="text-xs">C</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        {logoContent}
      </motion.div>
    );
  }

  return logoContent;
}