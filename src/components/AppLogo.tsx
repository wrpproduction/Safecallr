import React from "react";

interface AppLogoProps {
  size?: number; // width/height of the icon container in pixels (default is 32)
  showText?: boolean; // whether to show the "SafeCallr" text (default is true)
  className?: string; // extra classes to pass to the wrapper div
  textClassName?: string; // extra classes to pass to the text span
  iconContainerClassName?: string; // extra classes to pass to the icon container div
}

export default function AppLogo({
  size = 32,
  showText = true,
  className = "",
  textClassName = "",
  iconContainerClassName = "",
}: AppLogoProps) {
  const isDefaultSize = size === 32;

  // Exact replication of classes/inline styling to be 100% identical at default size,
  // and proportionally scalable at other custom sizes.
  const containerStyle = isDefaultSize
    ? {}
    : {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${size * 0.25}px`,
      };

  const iconStyle = isDefaultSize
    ? {}
    : {
        fontSize: `${size * 0.625}px`,
      };

  const textStyle = isDefaultSize
    ? {}
    : {
        fontSize: `${size * 0.625}px`,
      };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${
          isDefaultSize ? "w-8 h-8 rounded-lg" : ""
        } bg-primary flex items-center justify-center shrink-0 ${iconContainerClassName}`}
        style={containerStyle}
      >
        <span
          className="material-symbols-outlined text-on-primary"
          style={isDefaultSize ? { fontSize: "20px" } : iconStyle}
        >
          security
        </span>
      </div>
      {showText && (
        <span
          className={`font-headline font-black tracking-tighter text-primary ${
            isDefaultSize ? "text-xl" : ""
          } ${textClassName}`}
          style={textStyle}
        >
          SafeCallr
        </span>
      )}
    </div>
  );
}
