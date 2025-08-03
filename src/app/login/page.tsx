"use client";
import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "@/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
      setSuccess("Login successful!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative">
      {/* Fireflies Background */}
      <div className="fireflies">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="firefly"></div>
        ))}
      </div>
      
      <div className="relative z-10">
        <form onSubmit={handleSubmit} className="modern-card p-8 rounded-2xl w-full max-w-md flex flex-col gap-6 animate-fade-in-up">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold gradient-text mb-2 animate-glow">Let&apos;s get started!</h1>
            <p className="text-gray-300">Sign in to continue your UPSC journey</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-4 rounded-xl glass-dark border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all duration-300"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                className="w-full p-4 rounded-xl glass-dark border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all duration-300"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </button>
          
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-400 text-sm text-center bg-green-500/10 p-3 rounded-lg border border-green-500/20 animate-fade-in">
              {success}
            </div>
          )}
          
          <div className="text-center text-sm mt-4">
            <span className="text-gray-400">Don't have an account? </span>
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-semibold">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 