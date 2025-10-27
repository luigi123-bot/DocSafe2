# Clerk Sign-In Styling Guide

This guide shows different ways to style Clerk Elements starting from a minimal sign-in flow. All examples live under `src/app/sign-in/[[...sign-in]]/page.tsx`, so you can switch between them as needed while iterating on the DocSafe UI.

## 1. Base Sign-In Flow

The examples below extend this foundational setup built on `@clerk/elements`. It gives you full control over markup and styling layers.

```tsx
'use client'

import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'

export default function SignInPage() {
  return (
    <SignIn.Root>
      <SignIn.Step name="start">
        <Clerk.Connection name="google">Sign in with Google</Clerk.Connection>
        <Clerk.Field name="identifier">
          <Clerk.Label>Email</Clerk.Label>
          <Clerk.Input />
          <Clerk.FieldError />
        </Clerk.Field>
        <SignIn.Action submit>Continue</SignIn.Action>
      </SignIn.Step>
      <SignIn.Step name="verifications">
        <SignIn.Strategy name="email_code">
          <Clerk.Field name="code">
            <Clerk.Label>Code</Clerk.Label>
            <Clerk.Input />
            <Clerk.FieldError />
          </Clerk.Field>
          <SignIn.Action submit>Verify</SignIn.Action>
        </SignIn.Strategy>
      </SignIn.Step>
    </SignIn.Root>
  )
}
```

## 2. Tailwind CSS

When Tailwind is already configured (as in DocSafe) you can add utility classes directly. Most Clerk Elements accept `className`, so IntelliSense can confirm support in your editor.

```tsx
<SignIn.Step
  name="start"
  className="bg-white w-96 rounded-2xl py-10 px-8 shadow-sm border space-y-6"
>
  <div className="grid grid-cols-2 gap-x-4">
    <Clerk.Connection
      name="google"
      className="flex items-center gap-x-3 justify-center font-medium border shadow-sm py-1.5 px-2.5 rounded-md"
    >
      <Clerk.Icon className="size-4" />
      Google
    </Clerk.Connection>
    <Clerk.Connection
      name="github"
      className="flex items-center gap-x-3 justify-center font-medium border shadow-sm py-1.5 px-2.5 rounded-md"
    >
      <Clerk.Icon className="size-4" />
      GitHub
    </Clerk.Connection>
  </div>
  <Clerk.Field name="identifier" className="space-y-2">
    <Clerk.Label className="text-sm font-medium">Email</Clerk.Label>
    <Clerk.Input className="w-full border rounded-md py-1.5 px-2.5" />
    <Clerk.FieldError className="block text-red-500 text-sm" />
  </Clerk.Field>
  <SignIn.Action submit className="bg-black text-white rounded-md py-1.5 px-2.5">
    Continue
  </SignIn.Action>
</SignIn.Step>
```

## 3. Reusing Existing Components with `asChild`

If you already have buttons and inputs in your component library, enable the `asChild` prop. Make sure your components forward refs and spread props.

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

<SignIn.Step name="start">
  <Clerk.Connection name="google" asChild>
    <Button variant="outline">Sign in with Google</Button>
  </Clerk.Connection>
  <Clerk.Field name="identifier">
    <Clerk.Label>Email</Clerk.Label>
    <Clerk.Input asChild>
      <Input />
    </Clerk.Input>
    <Clerk.FieldError />
  </Clerk.Field>
  <SignIn.Action submit asChild>
    <Button>Continue</Button>
  </SignIn.Action>
</SignIn.Step>
```

> ✅ Requirements: components used with `asChild` must be created with `forwardRef` and spread incoming props.

## 4. CSS Modules

Prefer CSS Modules when you need scoping or want to keep Tailwind utility usage to a minimum. Create `sign-in.module.css` next to the page component.

```css
/* sign-in.module.css */
.startStep {
  background: white;
  border-radius: 1rem;
  padding: 2.5rem 2rem;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12);
}

.provider {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-weight: 500;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.input {
  border: 1px solid #cbd5f5;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
}

.error {
  color: #ef4444;
  font-size: 0.875rem;
}

.submit {
  background: #111827;
  color: white;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
}
```

```tsx
import styles from './sign-in.module.css'

<SignIn.Step name="start" className={styles.startStep}>
  <Clerk.Connection name="google" className={styles.provider}>
    Sign in with Google
  </Clerk.Connection>
  <Clerk.Field name="identifier">
    <Clerk.Label className={styles.label}>Email</Clerk.Label>
    <Clerk.Input className={styles.input} />
    <Clerk.FieldError className={styles.error} />
  </Clerk.Field>
  <SignIn.Action submit className={styles.submit}>
    Continue
  </SignIn.Action>
</SignIn.Step>
```

## 5. Inline Styles

Inline styles are handy for quick iterations or conditional logic.

```tsx
<SignIn.Step
  name="start"
  style={{
    backgroundColor: '#fff',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.75rem',
  }}
>
  <Clerk.Field name="identifier">
    <Clerk.Label
      style={{
        color: '#334155',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      Email
    </Clerk.Label>
    <Clerk.Input
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
      }}
    />
  </Clerk.Field>
  <SignIn.Action
    submit
    style={{
      backgroundColor: '#111827',
      color: '#fff',
      padding: '0.75rem 1rem',
      borderRadius: '0.75rem',
      fontWeight: 600,
    }}
  >
    Continue
  </SignIn.Action>
</SignIn.Step>
```

## 6. State-Based Styling

Clerk Elements expose `data-valid` and `data-invalid` attributes. You can hook into them with CSS, Tailwind variants, or logic inside your components.

```css
/* styles/sign-in.css */
.input {
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
}

.input[data-invalid] {
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
}

.input[data-valid] {
  border-color: #22c55e;
}
```

```tsx
<Clerk.Input className="input" />
```

## 7. Integrating with the Existing Page

- The current production sign-in screen uses `<SignIn />` from `@clerk/nextjs`. Swap to the base example above when you want the full control provided by Elements.
- Wrap new layouts with your existing `src/app/login/layout.tsx` shell so headers, footers, and metadata stay consistent.
- When experimenting, commit variants in feature branches or save them in this guide to avoid losing working configurations.

## 8. Next Steps

1. Pick the styling strategy that matches the rest of the DocSafe design system.
2. Update `src/app/sign-in/[[...sign-in]]/page.tsx` with the chosen example, keeping any shared layout wrappers.
3. Refresh the page locally with `pnpm dev` (or your preferred script) to verify Clerk renders the new layout.
4. For analytics on UI changes, wrap buttons with your existing tracking hooks before shipping.

With these patterns you can blend Clerk authentication screens seamlessly with the rest of the DocSafe experience.
