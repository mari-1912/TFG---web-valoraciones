import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CarouselContextValue = {
  scrollRef: React.RefObject<HTMLDivElement>;
  orientation: "horizontal" | "vertical";
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("Carousel components must be used within <Carousel />");
  }
  return context;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
  } else {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, children, orientation = "horizontal", ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const updateState = React.useCallback(() => {
      const node = scrollRef.current;
      if (!node) return;

      if (orientation === "horizontal") {
        const max = node.scrollWidth - node.clientWidth;
        setCanScrollPrev(node.scrollLeft > 0);
        setCanScrollNext(node.scrollLeft < max - 1);
      } else {
        const max = node.scrollHeight - node.clientHeight;
        setCanScrollPrev(node.scrollTop > 0);
        setCanScrollNext(node.scrollTop < max - 1);
      }
    }, [orientation]);

    React.useEffect(() => {
      updateState();
      const node = scrollRef.current;
      if (!node) return;

      const handle = () => updateState();
      node.addEventListener("scroll", handle, { passive: true });
      window.addEventListener("resize", handle);
      return () => {
        node.removeEventListener("scroll", handle);
        window.removeEventListener("resize", handle);
      };
    }, [updateState]);

    React.useEffect(() => {
      updateState();
    }, [children, updateState]);

    const scrollByPage = React.useCallback(
      (direction: "prev" | "next") => {
        const node = scrollRef.current;
        if (!node) return;
        const amount =
          (orientation === "horizontal" ? node.clientWidth : node.clientHeight) *
          0.9;
        const delta = direction === "next" ? amount : -amount;
        node.scrollBy({
          left: orientation === "horizontal" ? delta : 0,
          top: orientation === "vertical" ? delta : 0,
          behavior: "smooth",
        });
      },
      [orientation],
    );

    const value = React.useMemo<CarouselContextValue>(
      () => ({
        scrollRef,
        orientation,
        canScrollPrev,
        canScrollNext,
        scrollPrev: () => scrollByPage("prev"),
        scrollNext: () => scrollByPage("next"),
      }),
      [scrollByPage, orientation, canScrollPrev, canScrollNext],
    );

    return (
      <CarouselContext.Provider value={value}>
        <div
          ref={ref}
          role="region"
          aria-roledescription="carousel"
          className={cn("relative", className)}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { scrollRef, orientation } = useCarousel();

  return (
    <div
      ref={(node) => {
        setRef(scrollRef, node);
        setRef(ref, node);
      }}
      className={cn(
        "flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        orientation === "vertical" &&
          "flex-col overflow-y-auto snap-y snap-mandatory",
        className,
      )}
      {...props}
    />
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "shrink-0 grow-0 basis-full snap-start",
        orientation === "vertical" && "basis-auto",
        className,
      )}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <button
      ref={ref}
      type="button"
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 z-10",
        "inline-flex h-9 w-9 items-center justify-center rounded-full",
        "bg-[hsl(var(--color-primary))]/60 text-white shadow ring-1 ring-white/40",
        "transition hover:bg-[hsl(var(--color-primary))]/70 disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Anterior</span>
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <button
      ref={ref}
      type="button"
      onClick={scrollNext}
      disabled={!canScrollNext}
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 z-10",
        "inline-flex h-9 w-9 items-center justify-center rounded-full",
        "bg-[hsl(var(--color-primary))]/60 text-white shadow ring-1 ring-white/40",
        "transition hover:bg-[hsl(var(--color-primary))]/70 disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Siguiente</span>
    </button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
