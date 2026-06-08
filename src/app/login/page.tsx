"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { triggerNotification, setIsLoading: setGlobalLoading, setLoadingMsg: setGlobalLoadingMsg } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      triggerNotification("Username dan Kata Sandi wajib diisi.");
      return;
    }

    setIsLoading(true);
    setGlobalLoadingMsg("Memverifikasi kredensial...");
    setGlobalLoading(true);

    try {
      // 1. Resolve user identifier (NIP, email, or username) to email
      const res = await fetch("/api/auth/resolve-identifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: username.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        triggerNotification(errData.error || "Kredensial tidak valid.");
        setIsLoading(false);
        setGlobalLoading(false);
        return;
      }

      const { email } = await res.json();

      // 2. Sign in with Better Auth client using email and password
      const { data, error } = await authClient.signIn.email({
        email,
        password: password,
      });

      if (error) {
        triggerNotification(error.message || "Gagal masuk, periksa kembali kata sandi Anda.");
        setIsLoading(false);
        setGlobalLoading(false);
        return;
      }

      triggerNotification("Login berhasil!");
      router.push("/");
    } catch (err) {
      console.error(err);
      triggerNotification("Terjadi kesalahan sistem.");
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setGlobalLoadingMsg("Menghubungkan ke Google Account...");
    setGlobalLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      console.error(err);
      triggerNotification("Gagal masuk dengan Google.");
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-on-background flex flex-col font-sans antialiased overflow-x-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">

        {/* Branding Header */}
        <div className="w-full max-w-sm flex flex-col items-center mb-8 animate-fade-in text-center">
          <div>
            <Image
              alt="SKP Online Logo"
              className="w-35 h-35 object-contain"
              src="/img/logo.webp"
              width={40}
              height={40}
              priority
              unoptimized
            />
          </div>
          <span className="font-plus-jakarta-sans text-[32px] font-black tracking-tight text-on-surface select-none">
            Work<span className="text-primary">log</span>
          </span>
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-widest mt-1">Jurnal SKP ASN</p>
        </div>

        {/* Welcome Text */}
        <div className="w-full max-w-sm mb-6">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-2">Selamat Datang Kembali</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Silakan masukkan kredensial Anda untuk mengakses sistem pemantauan kinerja.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          {/* NIP / Username */}
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="username">
              NIP / Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <input
                id="username"
                name="username"
                type="text"
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan NIP atau Username"
                className="w-full h-12 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="password">
              Kata Sandi
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant disabled:opacity-60"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={togglePassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]" id="password-toggle-icon">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => triggerNotification("Tautan reset kata sandi telah dikirim ke email dinas Anda.")}
                className="font-label-sm text-label-sm text-primary hover:underline transition-all cursor-pointer border-none bg-transparent"
              >
                Lupa Kata Sandi?
              </button>
            </div>
          </div>

          {/* Primary Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary text-on-primary font-label-md rounded-xl shadow-md hover:bg-primary-container hover:text-on-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk Ke Akun</span>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="grow border-t border-outline-variant"></div>
            <span className="shrink mx-4 text-outline font-label-sm uppercase tracking-tighter">atau</span>
            <div className="grow border-t border-outline-variant"></div>
          </div>

          {/* Social Login */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md rounded-xl hover:bg-surface-container-low transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-on-surface border-t-transparent rounded-full animate-spin shrink-0"></div>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
            )}
            <span>Masuk dengan Google</span>
          </button>
        </form>

        {/* Footer Links */}
        <footer className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-6">
            <button
              onClick={() => triggerNotification("Hubungi admin kepegawaian untuk bantuan login.")}
              className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              Bantuan
            </button>
            <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
            <button
              onClick={() => triggerNotification("Kebijakan privasi mengikuti regulasi Satu Data Kepegawaian.")}
              className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              Kebijakan Privasi
            </button>
          </div>
          <p className="font-label-sm text-label-sm text-outline-variant">© 2026 CDK Wilayah Trenggalek</p>
        </footer>
      </main>
    </div>
  );
}
