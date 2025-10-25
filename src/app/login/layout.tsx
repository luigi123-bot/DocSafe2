

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">    
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}