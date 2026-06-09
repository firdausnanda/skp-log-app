"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useApp } from "@/context/AppContext";

interface UserWithCustomFields {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  username?: string | null;
  displayUsername?: string | null;
  nip?: string;
  pangkatGolongan?: string;
  jabatan?: string;
  unitKerja?: string;
  tandaTangan?: string;
}

interface UpdateUserParams {
  name?: string;
  image?: string;
  nip?: string;
  pangkatGolongan?: string;
  jabatan?: string;
  unitKerja?: string;
  tandaTangan?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const {
    triggerNotification,
    setIsLoading,
    setLoadingMsg,
    showLoading,
    confirmAction,
  } = useApp();

  const { data: session, refetch } = authClient.useSession();
  const user = session?.user as UserWithCustomFields | undefined;

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    nip: "",
    pangkatGolongan: "",
    jabatan: "",
    unitKerja: "",
  });

  // Password editing state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Signature uploading state
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Avatar uploading state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);



  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoadingMsg("Kembali...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/");
    }, 350);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      triggerNotification("Nama Lengkap tidak boleh kosong!");
      return;
    }

    setIsProfileSaving(true);
    await showLoading("Menyimpan profil...", 800);

    try {
      const res = await authClient.updateUser({
        name: profileForm.name.trim(),
        nip: profileForm.nip.trim(),
        pangkatGolongan: profileForm.pangkatGolongan.trim(),
        jabatan: profileForm.jabatan.trim(),
        unitKerja: profileForm.unitKerja.trim(),
      } as UpdateUserParams);

      if (res.error) {
        triggerNotification(res.error.message || "Gagal memperbarui profil.");
      } else {
        await refetch();
        triggerNotification("Profil berhasil diperbarui!");
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Terjadi kesalahan saat memperbarui profil.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      triggerNotification("Semua kolom kata sandi wajib diisi!");
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerNotification("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    if (newPassword.length < 6) {
      triggerNotification("Kata sandi baru minimal 6 karakter!");
      return;
    }

    setIsPasswordSaving(true);
    await showLoading("Memperbarui kata sandi...", 1000);

    try {
      const res = await authClient.changePassword({
        newPassword: newPassword,
        currentPassword: oldPassword,
        revokeOtherSessions: true,
      });

      if (res.error) {
        triggerNotification(res.error.message || "Gagal memperbarui kata sandi. Pastikan kata sandi lama Anda benar.");
      } else {
        triggerNotification("Kata sandi berhasil diperbarui!");
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Terjadi kesalahan saat memperbarui kata sandi.");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleLogoutClick = () => {
    confirmAction({
      title: "Keluar Akun",
      message: "Apakah Anda yakin ingin mengakhiri sesi aktif Anda?",
      confirmLabel: "Logout",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        setLoadingMsg("Keluar dari akun...");
        setIsLoading(true);
        try {
          await authClient.signOut();
          triggerNotification("Anda berhasil keluar.");
          router.push("/login");
        } catch (err) {
          console.error(err);
          triggerNotification("Gagal keluar dari akun.");
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      triggerNotification("Hanya diperbolehkan mengunggah file gambar!");
      return;
    }

    setIsUploadingSignature(true);
    await showLoading("Mengunggah tanda tangan...", 1000);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("rhk", "Tanda Tangan");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const updateRes = await authClient.updateUser({
          tandaTangan: data.url,
        } as UpdateUserParams);

        if (updateRes.error) {
          triggerNotification(updateRes.error.message || "Gagal menyimpan tanda tangan ke profil.");
        } else {
          await refetch();
          triggerNotification("Tanda tangan berhasil diunggah!");
        }
      } else {
        const errData = await res.json();
        triggerNotification(errData.error || "Gagal mengunggah file.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Terjadi kesalahan saat mengunggah tanda tangan.");
    } finally {
      setIsUploadingSignature(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      triggerNotification("Hanya diperbolehkan mengunggah file gambar!");
      return;
    }

    setIsUploadingAvatar(true);
    await showLoading("Mengunggah foto profil...", 1000);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("rhk", "Foto Profil");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const updateRes = await authClient.updateUser({
          image: data.url,
        } as UpdateUserParams);

        if (updateRes.error) {
          triggerNotification(updateRes.error.message || "Gagal menyimpan foto profil.");
        } else {
          await refetch();
          triggerNotification("Foto profil berhasil diunggah!");
        }
      } else {
        const errData = await res.json();
        triggerNotification(errData.error || "Gagal mengunggah file.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Terjadi kesalahan saat mengunggah foto profil.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const avatarUrl = user?.image || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header back nav */}
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-1 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer border-none bg-transparent"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <span className="font-headline-md text-headline-md text-primary font-bold">Pengaturan Akun</span>
        </div>
        <div className="flex items-center">
          <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance
          </span>
        </div>
      </div>

      {/* Profile Section */}
      <section className="flex flex-col gap-3">
        <h2 className="font-label-md text-xs text-on-surface-variant px-1 uppercase tracking-wider">
          Informasi Profil
        </h2>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col items-center gap-5">
          <div className="relative">
            <Image
              alt="User Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-surface-container shadow-md"
              src={avatarUrl}
              width={96}
              height={96}
              unoptimized
            />
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-on-primary p-2 rounded-full shadow-lg active:scale-90 transition-transform cursor-pointer border-none flex items-center justify-center disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          {isEditing ? (
            <form onSubmit={handleProfileSave} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant">Nama Lengkap</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Masukkan nama lengkap..."
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant">NIP</label>
                <input
                  type="text"
                  value={profileForm.nip}
                  onChange={(e) => setProfileForm({ ...profileForm, nip: e.target.value })}
                  className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Masukkan NIP..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant">Pangkat / Golongan</label>
                <input
                  type="text"
                  value={profileForm.pangkatGolongan}
                  onChange={(e) => setProfileForm({ ...profileForm, pangkatGolongan: e.target.value })}
                  className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Contoh: Pembina - IV/a..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant">Jabatan</label>
                <input
                  type="text"
                  value={profileForm.jabatan}
                  onChange={(e) => setProfileForm({ ...profileForm, jabatan: e.target.value })}
                  className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Masukkan jabatan..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant">Unit Kerja</label>
                <input
                  type="text"
                  value={profileForm.unitKerja}
                  onChange={(e) => setProfileForm({ ...profileForm, unitKerja: e.target.value })}
                  className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Masukkan unit kerja..."
                />
              </div>

              <div className="flex gap-3 mt-2 border-t border-outline-variant/30 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 border border-outline text-on-surface-variant font-label-md text-xs font-semibold rounded-lg hover:bg-surface-container-low transition-all cursor-pointer bg-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="flex-1 h-11 bg-primary text-on-primary font-label-md text-xs font-semibold rounded-lg hover:bg-primary-container transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col border-b border-outline-variant/60 pb-3">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Nama Lengkap</span>
                <span className="font-body-md text-sm text-on-surface font-semibold mt-0.5">
                  {user?.name || "-"}
                </span>
              </div>
              
              <div className="flex flex-col border-b border-outline-variant/60 pb-3">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">NIP</span>
                <span className="font-body-md text-sm text-on-surface mt-0.5">
                  {user?.nip || "-"}
                </span>
              </div>

              <div className="flex flex-col border-b border-outline-variant/60 pb-3">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Pangkat / Golongan</span>
                <span className="font-body-md text-sm text-on-surface mt-0.5">
                  {user?.pangkatGolongan || "-"}
                </span>
              </div>

              <div className="flex flex-col border-b border-outline-variant/60 pb-3">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Jabatan</span>
                <span className="font-body-md text-sm text-on-surface mt-0.5">
                  {user?.jabatan || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Unit Kerja</span>
                <span className="font-body-md text-sm text-on-surface mt-0.5">
                  {user?.unitKerja || "-"}
                </span>
              </div>

              {/* Tanda Tangan Section */}
              <div className="flex flex-col border-t border-outline-variant/30 pt-4 mt-2">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider block mb-2">Tanda Tangan</span>
                {user?.tandaTangan ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative w-full max-w-[200px] h-28 border border-outline-variant/60 rounded-xl bg-white p-2 flex items-center justify-center shadow-inner overflow-hidden">
                      <Image
                        alt="Tanda Tangan"
                        className="max-h-full max-w-full object-contain"
                        src={user.tandaTangan}
                        width={200}
                        height={112}
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isUploadingSignature}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full max-w-[200px] py-2 border border-primary text-primary font-label-md text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-surface-container-low transition-all cursor-pointer bg-transparent"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      Ubah Tanda Tangan
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="relative w-full max-w-[200px] h-28 border border-outline-variant/60 rounded-xl bg-white p-2 flex items-center justify-center shadow-inner overflow-hidden select-none">
                      <Image
                        alt="Placeholder Tanda Tangan"
                        className="max-h-full max-w-full object-contain opacity-55"
                        src="https://placehold.co/400"
                        width={200}
                        height={112}
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isUploadingSignature}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full max-w-[200px] py-2.5 bg-primary text-on-primary font-label-md text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-primary-container transition-all cursor-pointer border-none shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      Unggah Tanda Tangan
                    </button>
                  </div>
                )}
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSignatureUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setProfileForm({
                      name: user.name || "",
                      nip: user.nip || "",
                      pangkatGolongan: user.pangkatGolongan || "",
                      jabatan: user.jabatan || "",
                      unitKerja: user.unitKerja || "",
                    });
                  }
                  setIsEditing(true);
                }}
                className="w-full h-12 border border-primary text-primary font-label-md text-xs font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer bg-transparent mt-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_edit</span>
                Edit Profil
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Security Section */}
      <section className="flex flex-col gap-3">
        <h2 className="font-label-md text-xs text-on-surface-variant px-1 uppercase tracking-wider">
          Keamanan
        </h2>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[20px]">lock_reset</span>
            <h3 className="font-headline-md text-sm font-bold text-on-surface">Perbarui Kata Sandi</h3>
          </div>

          <form onSubmit={handlePasswordSave} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] text-on-surface-variant" htmlFor="old-password">
                Kata Sandi Lama
              </label>
              <input
                type="password"
                id="old-password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline-variant"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] text-on-surface-variant" htmlFor="new-password">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                id="new-password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline-variant"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] text-on-surface-variant" htmlFor="confirm-password">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                id="confirm-password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline-variant"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPasswordSaving}
              className="w-full h-11 bg-primary text-on-primary font-label-md text-xs font-semibold rounded-lg mt-1 shadow-sm hover:bg-primary-container transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              Perbarui Kata Sandi
            </button>
          </form>
        </div>
      </section>

      {/* Danger Zone / Logout */}
      <section className="flex flex-col gap-4 mb-4">
        <div className="bg-error-container/20 border border-error/25 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-label-md text-sm text-on-error-container font-bold">Keluar Akun</span>
            <span className="text-[11px] text-on-error-container/85 mt-0.5">Akhiri sesi aktif Anda</span>
          </div>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="px-4 py-2 bg-error hover:opacity-90 text-white rounded-lg font-label-md text-xs font-semibold active:scale-95 transition-all cursor-pointer border-none"
          >
            Logout
          </button>
        </div>
      </section>
    </div>
  );
}
