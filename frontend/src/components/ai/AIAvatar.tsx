import React, { useState } from "react";
import { Bot } from "lucide-react";
import avatarSrc from "@/assets/sehatbeat-avatar.png";

type AvatarSize = "sm" | "md" | "lg";

interface AIAvatarProps {
  /** sm = 40px | md = 64px (default) | lg = 96px */
  size?: AvatarSize;
  /** Extra Tailwind classes to apply to the wrapper */
  className?: string;
  /** Whether the floating animation should run */
  animated?: boolean;
}

const SIZE_MAP: Record<AvatarSize, { wrapper: string; icon: string }> = {
  sm: { wrapper: "w-10 h-10", icon: "w-5 h-5" },
  md: { wrapper: "w-16 h-16", icon: "w-8 h-8" },
  lg: { wrapper: "w-24 h-24", icon: "w-12 h-12" },
};

/**
 * AIAvatar — reusable circular avatar for SehatBeat AI.
 *
 * Features:
 *  - Circular crop with soft teal glow ring
 *  - Gentle floating/breathing CSS animation (`animate-float`)
 *  - Falls back to a Bot icon gradient circle if the image fails to load
 */
const AIAvatar: React.FC<AIAvatarProps> = ({
  size = "md",
  className = "",
  animated = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const { wrapper, icon } = SIZE_MAP[size];

  return (
    <div
      className={[
        wrapper,
        "relative flex-shrink-0",
        animated ? "animate-float" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Glow halo */}
      <div
        className={[
          wrapper,
          "absolute inset-0 rounded-full",
          "bg-gradient-to-br from-teal-400/40 to-blue-500/40",
          "blur-md scale-110",
        ].join(" ")}
        aria-hidden
      />

      {/* Avatar image or fallback */}
      {!imgError ? (
        <img
          src={avatarSrc}
          alt="SehatBeat AI Avatar"
          onError={() => setImgError(true)}
          className={[
            wrapper,
            "relative rounded-full object-cover object-top",
            "ring-2 ring-teal-400/70 shadow-xl",
          ].join(" ")}
          draggable={false}
        />
      ) : (
        // Fallback — gradient circle with Bot icon
        <div
          className={[
            wrapper,
            "relative rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-blue-500 to-teal-500",
            "ring-2 ring-teal-400/70 shadow-xl",
          ].join(" ")}
          aria-label="SehatBeat AI"
        >
          <Bot className={`${icon} text-white`} />
        </div>
      )}
    </div>
  );
};

export default AIAvatar;
