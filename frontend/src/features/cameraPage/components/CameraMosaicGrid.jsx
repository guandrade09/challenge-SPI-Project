import React, { useRef, useState, useEffect } from 'react';
import { MosaicCameraItem } from './MosaicCameraItem';


export function CameraMosaicGrid({ cameras, currentIndex, currentCamera, onSelectCamera }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);

  if (!cameras || cameras.length <= 1) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setDraggedDistance(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
    setDraggedDistance(Math.abs(x - startX));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCameraClick = (cam, idx) => {
    if (draggedDistance < 5 && onSelectCamera) {
      onSelectCamera(cam || idx);
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-theme-head font-bold text-xs uppercase tracking-wider">
          MOSAICO DE CÂMERAS ({cameras.length})
        </span>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 w-full overflow-x-auto sm:overflow-x-visible select-none py-1 custom-scrollbar ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {cameras.map((cam, idx) => {
          const isActive = currentCamera && cam?.id 
            ? cam.id === currentCamera.id 
            : idx === currentIndex;

          return (
            <MosaicCameraItem
              key={cam.id || `mosaic-cam-${idx}`}
              cam={cam}
              isActive={isActive}
              onClick={() => handleCameraClick(cam, idx)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default CameraMosaicGrid;