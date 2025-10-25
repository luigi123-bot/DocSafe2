"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/contexts/AuthContext";
import FormInput from "./FormInput";
import Button from "./Button";
import AppLink from "./AppLink";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const success = await login(email, password);
      if (success) {
        router.push('/');
      } else {
        setError("Credenciales incorrectas. Prueba con demo@docusafe.com / demo123");
      }
    } catch {
      setError("Error al iniciar sesión. Por favor intenta de nuevo.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Please enter your details to sign in.</p>
        <div className="mt-2 text-sm text-blue-600">
          Demo: demo@docusafe.com / demo123
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Email"
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <FormInput
          label="Password"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Login'}
        </Button>

        <div className="flex justify-between text-sm">
          <AppLink href="/register" variant="primary">
            Create account
          </AppLink>
          <AppLink href="/forgot-password" variant="primary">
            Forgot password?
          </AppLink>
        </div>
      </form>
    </div>
  );
}