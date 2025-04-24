
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const images = [
  {
    url: "/lovable-uploads/c50a1c5c-2fa9-4fdc-aa84-00665a402a8e.png",
    caption: "חוויה קולינרית יוצאת דופן"
  },
  {
    url: "/lovable-uploads/1b001582-18c0-4dda-8734-52496542e5a1.png",
    caption: "אווירה מושלמת"
  },
];

const GalleryCarousel = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
          הגלריה שלנו
        </h2>
        
        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                  <img
                    src={image.url}
                    alt={image.caption}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-end justify-center p-6">
                    <p className="text-white text-xl font-medium">{image.caption}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="text-white bg-black/50 hover:bg-black/70 border-none -left-4" />
          <CarouselNext className="text-white bg-black/50 hover:bg-black/70 border-none -right-4" />
        </Carousel>
      </div>
    </section>
  );
};

export default GalleryCarousel;
