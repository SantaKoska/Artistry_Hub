import React, { useState, useEffect, useRef, useCallback } from "react";
import { BiPlay } from "react-icons/bi";

const VideoCarousel = ({ videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [moveDirection, setMoveDirection] = useState(null);
  const containerRef = useRef(null);

  const DRAG_THRESHOLD = 30;

  const getVideoId = useCallback((url) => {
    try {
      const videoId = url.split("v=")[1];
      const ampersandPosition = videoId?.indexOf("&");
      return ampersandPosition !== -1
        ? videoId.substring(0, ampersandPosition)
        : videoId;
    } catch (error) {
      console.error("Error parsing video URL:", error);
      return null;
    }
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === videos.length - 1 ? 0 : prevIndex + 1
    );
  }, [videos.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? videos.length - 1 : prevIndex - 1
    );
  }, [videos.length]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > DRAG_THRESHOLD) {
        const newDirection = deltaX > 0 ? "right" : "left";

        if (moveDirection !== newDirection) {
          setMoveDirection(newDirection);
          newDirection === "right" ? prevSlide() : nextSlide();
        }
        setStartX(e.clientX);
      }
    },
    [isDragging, startX, moveDirection, nextSlide, prevSlide]
  );

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.clientX);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setMoveDirection(null);
  }, []);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const deltaX = e.touches[0].clientX - startX;
      if (Math.abs(deltaX) > DRAG_THRESHOLD) {
        const newDirection = deltaX > 0 ? "right" : "left";

        if (moveDirection !== newDirection) {
          setMoveDirection(newDirection);
          newDirection === "right" ? prevSlide() : nextSlide();
        }
        setStartX(e.touches[0].clientX);
      }
    },
    [isDragging, startX, moveDirection, nextSlide, prevSlide]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setMoveDirection(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseUp);
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseUp);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const renderVideoCard = (video, index) => {
    const videoId = getVideoId(video.url);
    const position = index - currentIndex;

    return (
      <div
        key={video.url}
        className="absolute w-[350px] transition-all duration-700 ease-out"
        style={{
          transform: `
            translateX(${position * 370}px) 
            translateZ(${Math.abs(position) * -100}px) 
            rotateY(${position * 35}deg)
            scale(${Math.abs(position) > 1 ? 0.85 : 1})
          `,
          opacity: Math.abs(position) > 2 ? 0 : 1,
          zIndex: 10 - Math.abs(position),
          filter: `brightness(${Math.abs(position) > 1 ? 0.7 : 1})`,
        }}
      >
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-300 border border-yellow-500/20 hover:border-yellow-500/40">
          <div className="relative group">
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={video.title}
              className="w-full h-48 object-cover transform group-hover:scale-105 transition-all duration-500"
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 transform hover:scale-110 shadow-xl"
              >
                <BiPlay className="text-3xl" />
              </a>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-yellow-400 font-medium text-sm line-clamp-2 hover:line-clamp-none transition-all duration-300 leading-relaxed">
              {video.title}
            </h3>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full py-8">
      <div
        ref={containerRef}
        className="flex justify-center items-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="relative h-[320px] w-full overflow-hidden perspective-1000">
          <div className="flex justify-center items-center h-full">
            {videos.map((video, index) => renderVideoCard(video, index))}
          </div>
        </div>
      </div>

      <div className="text-center mt-4 text-gray-400 text-xs font-medium">
        <span className="px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/30 backdrop-blur-sm">
          ← Drag to explore more videos →
        </span>
      </div>
    </div>
  );
};

export default VideoCarousel;
