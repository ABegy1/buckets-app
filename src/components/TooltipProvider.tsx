/* TooltipProvider.tsx

    This component provides tooltip support for any element using the "data-tooltip" property.
    To use this simply add `data-tooltip="example tooltip"` to any element you wish to show "example tooltip" when hovering
*/
"use client"; // Ensure this runs in the client side

import { useState, useEffect, useRef } from "react";

interface TooltipProps {
  text: string;
  style: {
    left: string | number;
    right: string | number;
    top: string | number;
    bottom: string | number;
    transform: string;
  };
  visible: boolean;
}

export default function TooltipProvider() {
  const [tooltip, setTooltip] = useState<TooltipProps>({
    text: "",
    style: {
      left: "auto",
      right: "auto",
      top: "auto",
      bottom: "auto",
      transform: "none",
    },
    visible: false,
  });

  // Use a ref to store the timeout ID
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutDelay = 500; // Default delay before tooltip appears

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      timeoutRef.current = setTimeout(() => {
        const target = e.target as HTMLElement;
        const tooltipText = target.getAttribute("data-tooltip");
        const tooltipLocation = target.getAttribute("data-tooltip-loc");

        if (tooltipText) {
          const rect = target.getBoundingClientRect();
          let left = "auto",
            right = "auto",
            top = "auto",
            bottom = "auto",
            transform = "none";

          const tooltipPadding = 5;

          switch (tooltipLocation) {
            case "below":
              left = `${rect.left + rect.width / 2}px`;
              top = `${rect.bottom + tooltipPadding}px`;
              transform = "translate(-50%, 0%)";
              break;
            case "above":
              left = `${rect.left + rect.width / 2}px`;
              bottom = `${window.innerHeight - rect.top - tooltipPadding}px`;
              transform = "translate(-50%, 0%)";
              break;
            case "left":
              right = `${window.innerWidth - rect.left + tooltipPadding}px`;
              top = `${rect.top + rect.height / 2}px`;
              transform = "translate(0%, -50%)";
              break;
            case "right":
              left = `${rect.right + tooltipPadding}px`;
              top = `${rect.top + rect.height / 2}px`;
              transform = "translate(0%, -50%)";
              break;
            default:
              break;
          }

          setTooltip({
            text: tooltipText,
            style: { left, right, top, bottom, transform },
            visible: true,
          });
        }
      }, timeoutDelay);
    };

    const handleMouseOut = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setTooltip({
        text: "",
        style: {
          left: "auto",
          right: "auto",
          top: "auto",
          bottom: "auto",
          transform: "none",
        },
        visible: false,
      });
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return tooltip.visible ? (
    <div
      className="absolute bg-gray-500 text-white text-sm px-3 py-1 rounded shadow-lg"
      style={{
        left: tooltip.style.left,
        right: tooltip.style.right,
        top: tooltip.style.top,
        bottom: tooltip.style.bottom,
        transform: tooltip.style.transform,
        whiteSpace: "nowrap",
        zIndex: 2,
      }}
    >
      {tooltip.text}
    </div>
  ) : null;
}
