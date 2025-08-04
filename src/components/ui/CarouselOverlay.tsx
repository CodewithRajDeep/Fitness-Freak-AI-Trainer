
"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

import Image from "next/image"

const CarouselOverlay = () => {
  return (
    <Carousel
      className="w-full max-w-4xl mx-auto"
      orientation="horizontal"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {["/fitness1.jpg", "/fitness2.jpg", "/fitness3.jpg", "/fitness4.jpg"].map((img, index) => (
          <CarouselItem
            key={index}
            className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
          >
            <div className="relative h-64 overflow-hidden rounded-xl shadow-lg">
              <Image
                src={img}
                alt={`carousel-${index}`}
                fill
                className="object-cover object-center"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

export default CarouselOverlay
