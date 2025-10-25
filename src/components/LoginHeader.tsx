"use client";

import DocuSafeLogo from "./DocuSafeLogo";

export default function LoginHeader() {
  return (
    <header className="bg-red-500 text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <DocuSafeLogo />
          
          <div className="text-sm text-blue-200">
            Login / Registro
          </div>
        </div>
      </div>
    </header>
  );
}