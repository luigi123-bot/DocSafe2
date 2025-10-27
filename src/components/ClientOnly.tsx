"use client";


interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isClient = typeof window !== "undefined";

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}