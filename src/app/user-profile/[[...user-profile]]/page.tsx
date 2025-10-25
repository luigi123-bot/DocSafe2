import { UserProfile } from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Perfil de Usuario
          </h1>
          <p className="text-gray-600">
            Gestiona tu cuenta y configuraciones
          </p>
        </div>
        <UserProfile
          appearance={{
            elements: {
              card: 'shadow-xl border-0',
              headerTitle: 'text-gray-900',
              headerSubtitle: 'text-gray-600',
              formButtonPrimary: 'bg-red-500 hover:bg-red-600 text-white',
            }
          }}
        />
      </div>
    </div>
  );
}