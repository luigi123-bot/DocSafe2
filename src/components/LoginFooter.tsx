"use client";

import AppLink from "./AppLink";

export default function LoginFooter() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-center space-x-8 text-sm">
          <AppLink href="/terms" variant="default">
            Terms of Service
          </AppLink>
          <AppLink href="/privacy" variant="default">
            Privacy Policy
          </AppLink>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          © 2025 DocuSafe. All rights reserved.
        </div>
      </div>
    </footer>
  );
}