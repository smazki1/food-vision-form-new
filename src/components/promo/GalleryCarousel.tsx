
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const galleries = [
  {
    title: "אווירה יוקרתית",
    images: [
      {
        url: "/lovable-uploads/fe01098f-59b9-4d84-b387-deaace6bc703.png",
        caption: "אחרי"
      },
      {
        url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
        caption: "לפני"
      }
    ]
  },
  {
    title: "מטבח מודרני",
    images: [
      {
        url: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
        caption: "אחרי"
      },
      {
        url: "https://images.unsplash.com/photo-1493962853295-0fd70327578a",
        caption: "לפני"
      }
    ]
  },
  {
    title: "חוויה קולינרית",
    images: [
      {
        url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1",
        caption: "אחרי"
      },
      {
        url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
        caption: "לפני"
      }
    ]
  }
];

const GalleryCarousel = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
          הגלריה שלנו
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((gallery, index) => (
            <div 
              key={index} 
              className="group relative shadow-md transition-all duration-300 hover:shadow-xl rounded-xl overflow-hidden"
            >
              <Carousel className="w-full">
                <CarouselContent>
                  {gallery.images.map((image, imageIndex) => (
                    <CarouselItem key={imageIndex}>
                      <div className="relative aspect-square">
                        <img
                          src={image.url}
                          alt={`${gallery.title} - ${image.caption}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-6">
                          <div className="text-center">
                            <h3 className="text-white text-lg font-bold mb-2">{gallery.title}</h3>
                            <p className="text-white text-sm font-medium">{image.caption}</p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="text-white bg-black/50 hover:bg-black/70 border-none" />
                <CarouselNext className="text-white bg-black/50 hover:bg-black/70 border-none" />
              </Carousel>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GalleryCarousel;
