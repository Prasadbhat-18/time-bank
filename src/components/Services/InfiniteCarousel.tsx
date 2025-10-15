import React from 'react';

interface CarouselProps {
  images: string[];
  interval?: number;
}

export const InfiniteCarousel: React.FC<CarouselProps> = ({ images, interval = 3000 }) => {
  const [index, setIndex] = React.useState(0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (images.length <= 1) return;
    timeoutRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, images.length, interval]);

  if (!images.length) return null;

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-gray-100">
      {images.map((img, i) => (
        <img
          key={img + i}
          src={img}
          alt="Service"
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          style={{ pointerEvents: i === index ? 'auto' : 'none' }}
        />
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <span key={i} className={`block w-2 h-2 rounded-full ${i === index ? 'bg-emerald-500' : 'bg-white/70 border border-gray-300'}`}></span>
        ))}
      </div>
    </div>
  );
};
