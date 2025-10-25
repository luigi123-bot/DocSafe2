import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido a DocSafe
          </h1>
          <p className="text-gray-600">
            Inicia sesión para acceder a tu gestión de documentos
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-red-500 hover:bg-red-600 text-white',
              card: 'shadow-xl border-0',
              headerTitle: 'text-gray-900',
              headerSubtitle: 'text-gray-600',
            }
          }}
          redirectUrl="/"
        />
      </div>
    </div>
  );
}