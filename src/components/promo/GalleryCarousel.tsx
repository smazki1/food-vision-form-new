
import React from "react";

const images = [
  {
    url: "/lovable-uploads/fe01098f-59b9-4d84-b387-deaace6bc703.png",
    caption: "אווירה יוקרתית"
  },
  {
    url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    caption: "מנות שף מיוחדות"
  },
  {
    url: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
    caption: "מטבח מודרני"
  },
  {
    url: "https://images.unsplash.com/photo-1493962853295-0fd70327578a",
    caption: "חוויה קולינרית"
  },
  {
    url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1",
    caption: "אווירה מושלמת"
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
          {images.map((image, index) => (
            <div 
              key={index} 
              className="group relative aspect-square overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <img
                src={image.url}
                alt={image.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                <p className="text-white text-lg font-medium text-center">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GalleryCarousel;
