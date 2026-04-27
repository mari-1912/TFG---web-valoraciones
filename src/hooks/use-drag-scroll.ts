import { useRef, type DragEvent, type MouseEvent, type PointerEvent } from "react";

export function useDragScroll<T extends HTMLElement>() {
  const scrollRef = useRef<T | null>(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
  });

  const stopDragging = (event: PointerEvent<T>) => {
    dragRef.current.active = false;
    scrollRef.current?.classList.remove("is-dragging");
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  };

  return {
    ref: scrollRef,
    onPointerDown: (event: PointerEvent<T>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const node = scrollRef.current;
      if (!node) return;
      dragRef.current = {
        active: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: node.scrollLeft,
      };
      node.classList.add("is-dragging");
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<T>) => {
      const node = scrollRef.current;
      const drag = dragRef.current;
      if (!node || !drag.active) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
        drag.moved = true;
        node.scrollLeft = drag.scrollLeft - deltaX;
        event.preventDefault();
      }
    },
    onPointerUp: stopDragging,
    onPointerCancel: stopDragging,
    onClickCapture: (event: MouseEvent<T>) => {
      if (!dragRef.current.moved) return;
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    },
    onDragStart: (event: DragEvent<T>) => {
      event.preventDefault();
    },
  };
}
