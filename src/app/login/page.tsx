"use client";

import LoginForm from "~/components/LoginForm";
import LoginFooter from "~/components/LoginFooter";

export default function LoginPage() {
  return (
    <>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
      
      <LoginFooter />
    </>
  );
}