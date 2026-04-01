/**
 * ⚡ UNY PROTOCOL: SMART IMAGE COMPONENT (V1)
 * Description: Composant d'image intelligent qui détecte la vitesse de connexion.
 * Optimisé pour les connexions instables (Africa-Ready).
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface NetworkInformation extends EventTarget {
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  lowResSrc?: string; // Version basse résolution pour les connexions lentes
  priority?: boolean;
}

const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallback = 'https://picsum.photos/seed/placeholder/200/200',
  lowResSrc,
  priority = false
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // Détection de la vitesse de connexion via Network Information API
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      setConnectionType(connection.effectiveType || 'unknown');
      
      // Si la connexion est lente (2g, slow-2g), on privilégie la version basse résolution
      const isSlow = connection.effectiveType && ['2g', 'slow-2g'].includes(connection.effectiveType);
      
      if (isSlow && lowResSrc) {
        setCurrentSrc(lowResSrc);
      } else {
        setCurrentSrc(src);
      }
    } else {
      setCurrentSrc(src);
    }
  }, [src, lowResSrc]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    setCurrentSrc(fallback);
  };

  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]"
          >
            <Loader2 className="animate-spin text-blue-500/20" size={24} />
          </motion.div>
        )}
      </AnimatePresence>

      {currentSrc && (
        <motion.img
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: loading ? 0 : 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover ${loading ? 'invisible' : 'visible'}`}
          loading={priority ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
        />
      )}

      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/5 text-rose-500/40 p-4 text-center">
          <AlertCircle size={20} className="mb-2" />
          <span className="text-[8px] font-black uppercase tracking-widest">Signal Lost</span>
        </div>
      )}

      {/* Connection Indicator (Debug Mode Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[6px] font-black uppercase tracking-widest text-white/40 pointer-events-none">
          {connectionType}
        </div>
      )}
    </div>
  );
};

export default SmartImage;
