import React, { useState, useEffect } from 'react';
import { Pannellum } from 'pannellum-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, Maximize2, Minimize2, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, Home, X 
} from 'lucide-react';

// 360° Panorama Viewer Component
export function PanoramaViewer({ 
  images = [], 
  title = "360° View",
  autoLoad = true,
  height = "400px" 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl"
        style={{ height }}
      >
        <div className="text-center text-slate-500">
          <RotateCcw className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chưa có ảnh 360°</p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative rounded-xl overflow-hidden" data-testid="panorama-viewer">
      <Pannellum
        width="100%"
        height={height}
        image={currentImage.url}
        pitch={10}
        yaw={180}
        hfov={110}
        autoLoad={autoLoad}
        showZoomCtrl={false}
        showFullscreenCtrl={false}
        mouseZoom={true}
        draggable={true}
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
        {images.length > 1 && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-white text-sm px-2">
              {currentIndex + 1} / {images.length}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={handleNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20 h-8 w-8"
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Image Name */}
      {currentImage.name && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-white text-sm">{currentImage.name}</span>
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="relative">
            <Pannellum
              width="100%"
              height="85vh"
              image={currentImage.url}
              pitch={10}
              yaw={180}
              hfov={110}
              autoLoad={true}
              showZoomCtrl={true}
              showFullscreenCtrl={false}
              mouseZoom={true}
              draggable={true}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-white px-2">
                  {currentImage.name || `${currentIndex + 1} / ${images.length}`}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Virtual Tour Embed Component (Matterport, etc.)
export function VirtualTourEmbed({ 
  url, 
  title = "Virtual Tour",
  height = "500px",
  thumbnail = null
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTour, setShowTour] = useState(false);

  if (!url) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl"
        style={{ height }}
      >
        <div className="text-center text-slate-500">
          <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chưa có Virtual Tour</p>
        </div>
      </div>
    );
  }

  // Extract embed URL if it's a Matterport link
  const getEmbedUrl = (inputUrl) => {
    if (inputUrl.includes('matterport.com') && !inputUrl.includes('/show/')) {
      // Convert share link to embed
      const match = inputUrl.match(/m=([a-zA-Z0-9]+)/);
      if (match) {
        return `https://my.matterport.com/show/?m=${match[1]}`;
      }
    }
    return inputUrl;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <div 
      className="relative rounded-xl overflow-hidden bg-slate-900"
      style={{ height }}
      data-testid="virtual-tour-embed"
    >
      {!showTour && thumbnail ? (
        // Show thumbnail with play button
        <div className="relative w-full h-full">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Button
              onClick={() => setShowTour(true)}
              className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 text-lg"
            >
              <Home className="w-6 h-6 mr-2" />
              Bắt đầu Virtual Tour
            </Button>
          </div>
        </div>
      ) : (
        // Show iframe
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center text-white">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p>Đang tải Virtual Tour...</p>
              </div>
            </div>
          )}
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="xr-spatial-tracking"
            onLoad={() => setIsLoaded(true)}
            className={isLoaded ? 'opacity-100' : 'opacity-0'}
            title={title}
          />
        </>
      )}
    </div>
  );
}

// Google Maps Embed Component
export function GoogleMapEmbed({ 
  address,
  embedUrl,
  height = "400px",
  zoom = 15
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate embed URL from address if not provided
  const getMapUrl = () => {
    if (embedUrl) return embedUrl;
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
    }
    return null;
  };

  const mapUrl = getMapUrl();

  if (!mapUrl) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl"
        style={{ height }}
      >
        <div className="text-center text-slate-500">
          <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chưa có địa chỉ</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative rounded-xl overflow-hidden"
      style={{ height }}
      data-testid="google-map-embed"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Đang tải bản đồ...</p>
          </div>
        </div>
      )}
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setIsLoaded(true)}
        className={isLoaded ? 'opacity-100' : 'opacity-0'}
        title="Google Map"
      />
    </div>
  );
}

export default {
  PanoramaViewer,
  VirtualTourEmbed,
  GoogleMapEmbed
};
