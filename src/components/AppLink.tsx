import Link from "next/link";

interface AppLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  className?: string;
  external?: boolean;
}

export default function AppLink({ 
  href, 
  children, 
  variant = "default", 
  className = "",
  external = false
}: AppLinkProps) {
  const baseClasses = "transition-colors duration-200";
  
  const variantClasses = {
    default: "text-gray-600 hover:text-gray-800",
    primary: "text-red-500 hover:text-red-600",
    secondary: "text-blue-500 hover:text-blue-600"
  };

  const linkClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (external) {
    return (
      <a 
        href={href} 
        className={linkClasses}
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClasses}>
      {children}
    </Link>
  );
}