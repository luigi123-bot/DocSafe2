interface DocuSafeLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function DocuSafeLogo({ size = "md", className = "" }: DocuSafeLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-2xl"
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className={`${sizeClasses[size]} font-bold flex items-center ${className}`}>
      <div className="bg-white text-red-500 rounded-md p-1 mr-2">
        <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6v-1h8v1H6zm0 2v-1h8v1H6z"/>
        </svg>
      </div>
      DocuSafe
    </div>
  );
}