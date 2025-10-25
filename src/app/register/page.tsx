"use client";

import { useState } from "react";
import FormInput from "~/components/FormInput";
import Button from "~/components/Button";
import AppLink from "~/components/AppLink";
import LoginFooter from "~/components/LoginFooter";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register attempt:", formData);
  };

  return (
    <>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Crear Cuenta</h1>
              <p className="text-gray-600">Únete a DocuSafe para gestionar tus documentos</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                label="Nombre Completo"
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange("name")}
                placeholder="Ingresa tu nombre completo"
                required
              />

              <FormInput
                label="Email"
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="Ingresa tu email"
                required
              />

              <FormInput
                label="Contraseña"
                type="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange("password")}
                placeholder="Crea una contraseña"
                required
              />

              <FormInput
                label="Confirmar Contraseña"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                placeholder="Confirma tu contraseña"
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Crear Cuenta
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">¿Ya tienes cuenta? </span>
                <AppLink href="/login" variant="primary">
                  Iniciar Sesión
                </AppLink>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <LoginFooter />
    </>
  );
}