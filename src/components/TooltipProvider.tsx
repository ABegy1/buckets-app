/* TooltipProvider.tsx

    This component provides tooltip support for any element using the "data-tooltip" property.
    To use this simply add `data-tooltip="example tooltip"` to any element you wish to show "example tooltip" when hovering
*/

"use client"; // Ensure this runs in the client side

import { useState, useEffect, useRef } from "react";

interface TooltipProps {
  text: string,
  style: {
    left: string | number,
    right: string | number,
    top: string | number,
    bottom: string | number,
    transform: string | number
  },
  visible: boolean
}

export default function TooltipProvider() {
  const [tooltip, setTooltip] = useState<TooltipProps>({  text: "", 
                                                          style: {
                                                            left: "auto", 
                                                            right: "auto", 
                                                            top:"auto", 
                                                            bottom: "auto", 
                                                            transform: "auto" }, 
                                                          visible: false });
                                  
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      timeoutRef.current = setTimeout(() => {
        const target = e.target as HTMLElement;
        const tooltipText = target.getAttribute("data-tooltip");
        const tooltipLocation = target.getAttribute("data-tooltip-loc");

        if (tooltipText) {
          const rect = target.getBoundingClientRect();
          let left_edge: string | number = "initial";
          var right_edge: string | number = "initial";
          var top_edge: string | number = "initial";
          var bottom_edge: string | number = "initial";
          var xform: string | number = "initial";

          var tooltip_padding = 5;

          if(tooltipLocation){
              if(tooltipLocation === "below"){
                  left_edge = rect.left + rect.width / 2
                  top_edge = rect.bottom + tooltip_padding
                  xform = "translate(-50%, 0%)"
                  console.log("moving cursor below")
              }
              if(tooltipLocation === "above"){
                  left_edge = rect.left + rect.width / 2
                  bottom_edge = window.innerHeight - rect.top - tooltip_padding
                  xform = "translate(-50%, 0%)"
                  console.log("moving cursor above")
              }
              if(tooltipLocation === "left"){
                  right_edge = window.innerWidth - rect.left - tooltip_padding
                  top_edge = rect.top + rect.height / 2
                  xform = "translate(0%, -50%)"
                  console.log("moving cursor left")
              }
              if(tooltipLocation === "right"){
                  left_edge = rect.right + tooltip_padding
                  top_edge = rect.top + rect.height / 2
                  xform = "translate(0%, -50%)"
                  console.log("moving cursor right")
              }

          }
          setTooltip({
            text: tooltipText,
              style: {
                left: left_edge,
                right: right_edge,
                top: top_edge,
                bottom: bottom_edge,
                transform: xform},
            visible: true,
          });

          
          console.log(`left: ${left_edge}\n right: ${right_edge}\n top: ${top_edge}\n bottom: ${bottom_edge}`)
        }
      }, 500);
    };

    const handleMouseOut = () => {
      clearTimeout(timeoutRef.current);
      setTooltip({  text: "", 
                    style: {
                      left: "auto", 
                      right: "auto",
                      top: "auto",
                      bottom: "auto",
                      transform: "auto"},
                    visible: false });
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
      className="absolute bg-gray-800 text-white text-sm px-3 py-1 rounded shadow-lg"
      style={{
        left: `${tooltip.style.left}px`,
        right: `${tooltip.style.right}px`,
        top: `${tooltip.style.top}px`,
        bottom: `${tooltip.style.bottom}px`,
        transform: `${tooltip.style.transform}`,
        whiteSpace: "nowrap",
        zIndex:2
      }}
    >
      {tooltip.text}
    </div>
  ) : null;
}
