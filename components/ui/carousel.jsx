import React from "react";

const CarouselContext = React.createContext(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

const Carousel = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <CarouselContext.Provider value={{}}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  );
});

export { Carousel, useCarousel };
