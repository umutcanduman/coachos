"use client";

import { signup } from "./actions";
import Link from "next/link";
import { useState, useTransition } from "react";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signup(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccessEmail(result.email ?? formData.get("email") as string);
      }
    });
  }

  // Success state
  if (successEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#F8F7F5" }}>
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
          <div
            style={{
              width: 40, height: 40, borderRadius: 8,
              background: "#4A7C68", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Instrument Serif', serif", fontSize: "1.25rem", fontStyle: "italic",
              marginBottom: 24,
            }}
          >
            C
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "1.75rem", fontWeight: 400, color: "#1C1A17",
              marginBottom: 12,
            }}
          >
            Check your email
          </h1>
          <p style={{ fontFamily: "'Geist', sans-serif", fontSize: "0.9375rem", color: "#72695F", lineHeight: 1.7, marginBottom: 24 }}>
            We sent a confirmation link to{" "}
            <strong style={{ color: "#1C1A17" }}>{successEmail}</strong>.
            Click the link in the email to activate your account and log in.
          </p>
          <p style={{ fontFamily: "'Geist', sans-serif", fontSize: "0.8125rem", color: "#B8B0A6", lineHeight: 1.6 }}>
            Didn&apos;t receive it? Check your spam folder or contact us at{" "}
            <a href="mailto:umutcan.duman@gmail.com" style={{ color: "#4A7C68", textDecoration: "underline" }}>
              umutcan.duman@gmail.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#F8F7F5" }}>
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="text-center" style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 8,
              background: "#4A7C68", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Instrument Serif', serif", fontSize: "1.25rem", fontStyle: "italic",
            }}
          >
            C
          </div>
        </div>
        <h1
          className="mb-6 text-center"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "1.5rem", fontWeight: 400, color: "#1C1A17",
          }}
        >
          Create your CoachOS account
        </h1>

        {error && (
          <div
            style={{
              background: "#FEF3F3", border: "1px solid #FECACA",
              borderRadius: 8, padding: "12px 16px", marginBottom: 16,
              fontSize: "0.8125rem", color: "#B83232", lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium" style={{ color: "#72695F" }}>
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium" style={{ color: "#72695F" }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: "#72695F" }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 8, border: "none",
              background: isPending ? "#7fa696" : "#4A7C68", color: "#fff",
              fontFamily: "'Geist', sans-serif", fontSize: "0.9375rem", fontWeight: 500,
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {isPending ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm" style={{ color: "#72695F" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#4A7C68", textDecoration: "underline" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
