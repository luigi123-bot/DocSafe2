import { AuthProvider } from "~/contexts/AuthContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col">    
        <div className="flex-1">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}