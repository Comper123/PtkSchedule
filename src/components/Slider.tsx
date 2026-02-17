import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, ReactNode, useState } from "react";

interface SliderProps {
  children: ReactNode[];
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  showNumbers?: boolean;
}

export default function Slider({ 
  children, 
  className = '',
  showArrows = true,
  showDots = true,
  showNumbers = true
}: SliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = Children.toArray(children);
  const totalSlides = slides.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1))
  }

  const goToPage = (pageNumber: number) => {
    setCurrentIndex(pageNumber);
  }

  return (
    <div className={`relative mx-auto flex justify-normal items-center flex-col ${className}`}>
      <div className={`relative min-h-[200px] w-10/12 mx-auto ${className}`}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`
              w-full transition-all duration-300
              ${index === currentIndex 
                ? 'opacity-100 visible relative' 
                : 'opacity-0 invisible absolute top-0 left-0'
              }
            `}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Стрелки */}
      {showArrows && totalSlides > 1 && (
        <div>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 z-3"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 z-3"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Точки навигации */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-6 bg-blue-600' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Номера страниц */}
      {showNumbers && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <div className="px-4 rounded-md transition-all bg-gray-300 hover:bg-gray-400 h-9 flex items-center justify-center hover:cursor-pointer"
            onClick={() => goToPage(0)}
            >В начало</div>
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-md transition-all w-9 h-9 flex items-center justify-center hover:cursor-pointer ${
                index === currentIndex 
                  ? 'bg-blue-600 text-white' 
                  : ' bg-gray-300 hover:bg-gray-400'
              }`}
            >{index}</div>
          ))}
          <div className="px-4 rounded-md transition-all bg-gray-300 hover:bg-gray-400 h-9 flex items-center justify-center hover:cursor-pointer"
            onClick={() => goToPage(totalSlides - 1)}
            >В конец</div>
        </div>
      )}
    </div>
  );
}
