"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getRoleLabel } from "@/lib/utils/format";
import {
  profileSettingsSchema,
  resetPasswordSchema,
  type ProfileSettingsInput,
  type ResetPasswordInput,
} from "@/lib/validation/schemas";
import type { Company, UserProfile } from "@/types/app";

export function ProfileSettingsForm({
  company,
  profile,
}: {
  company: Company | null;
  profile: UserProfile;
}) {
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const profileForm = useForm<ProfileSettingsInput>({
    defaultValues: {
      contactNumber: profile.contact_number ?? "",
      fullName: profile.full_name,
    },
    resolver: zodResolver(profileSettingsSchema),
  });

  const passwordForm = useForm<ResetPasswordInput>({
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  function onAvatarChange(file: File | undefined) {
    setAvatarError(null);
    setAvatarSuccess(null);
    setAvatarFile(file ?? null);

    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  async function uploadAvatar() {
    if (!avatarFile) {
      setAvatarError("Choose a profile image first.");
      return;
    }

    setAvatarError(null);
    setAvatarSuccess(null);
    setIsAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch("/api/profile/avatar", {
        body: formData,
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload your profile image.");
      }

      setAvatarPreview(payload.avatarUrl);
      setAvatarFile(null);
      setAvatarSuccess("Profile image updated.");
      router.refresh();
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Unable to upload your profile image.");
    } finally {
      setIsAvatarUploading(false);
    }
  }

  async function saveProfile(values: ProfileSettingsInput) {
    setProfileError(null);
    setProfileSuccess(null);
    setIsProfileSaving(true);

    try {
      const response = await fetch("/api/profile", {
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update your profile.");
      }

      setProfileSuccess("Profile details saved.");
      router.refresh();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update your profile.");
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function updatePassword(values: ResetPasswordInput) {
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordSaving(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        throw error;
      }

      passwordForm.reset({
        confirmPassword: "",
        password: "",
      });
      setPasswordSuccess("Password updated.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to update your password.");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Upload a JPG, PNG, or WebP image up to 5 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#0F172A] bg-cover bg-center text-3xl font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
              style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}
            >
              {!avatarPreview ? <UserRound className="h-12 w-12 text-[#C9A646]" /> : null}
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#111827]">{profile.full_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
            <div className="mt-3 rounded-md border border-[#E5E7EB] bg-[#F8F6F2] px-3 py-2 text-xs font-semibold uppercase text-slate-600">
              {getRoleLabel(profile.role)}
            </div>
          </div>

          <FilePicker
            accept="image/jpeg,image/png,image/webp"
            description="JPG, PNG, or WebP image up to 5 MB."
            file={avatarFile}
            id="profile-avatar"
            label="Profile image"
            onChange={(file) => onAvatarChange(file ?? undefined)}
          />

          {avatarError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {avatarError}
            </p>
          ) : null}
          {avatarSuccess ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {avatarSuccess}
            </p>
          ) : null}

          <Button className="w-full" disabled={isAvatarUploading} onClick={uploadAvatar} type="button">
            <Camera className="h-4 w-4" />
            {isAvatarUploading ? "Uploading..." : "Upload photo"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Keep your account information current for reports, approvals, and support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={profileForm.handleSubmit(saveProfile)}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#111827]" htmlFor="profile-name">
                    Full name
                  </label>
                  <Input id="profile-name" autoComplete="name" {...profileForm.register("fullName")} />
                  <p className="min-h-4 text-xs font-medium text-rose-600">
                    {profileForm.formState.errors.fullName?.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#111827]" htmlFor="profile-phone">
                    Contact number
                  </label>
                  <Input
                    id="profile-phone"
                    autoComplete="tel"
                    placeholder="+1 555 0100"
                    {...profileForm.register("contactNumber")}
                  />
                  <p className="min-h-4 text-xs font-medium text-rose-600">
                    {profileForm.formState.errors.contactNumber?.message}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#111827]" htmlFor="profile-email">
                    Email
                  </label>
                  <Input id="profile-email" disabled value={profile.email} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#111827]" htmlFor="profile-company">
                    Company
                  </label>
                  <Input id="profile-company" disabled value={company?.name ?? "Global"} />
                </div>
              </div>

              {profileError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {profileError}
                </p>
              ) : null}
              {profileSuccess ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {profileSuccess}
                </p>
              ) : null}

              <div>
                <Button disabled={isProfileSaving} type="submit">
                  {isProfileSaving ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Use a strong password with at least 12 characters, uppercase, lowercase, and a number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={passwordForm.handleSubmit(updatePassword)}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#111827]" htmlFor="profile-password">
                    New password
                  </label>
                  <Input
                    id="profile-password"
                    autoComplete="new-password"
                    type="password"
                    {...passwordForm.register("password")}
                  />
                  <p className="min-h-4 text-xs font-medium text-rose-600">
                    {passwordForm.formState.errors.password?.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#111827]" htmlFor="profile-confirm-password">
                    Confirm password
                  </label>
                  <Input
                    id="profile-confirm-password"
                    autoComplete="new-password"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                  />
                  <p className="min-h-4 text-xs font-medium text-rose-600">
                    {passwordForm.formState.errors.confirmPassword?.message}
                  </p>
                </div>
              </div>

              {passwordError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {passwordError}
                </p>
              ) : null}
              {passwordSuccess ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {passwordSuccess}
                </p>
              ) : null}

              <div>
                <Button disabled={isPasswordSaving} type="submit" variant="outline">
                  <LockKeyhole className="h-4 w-4" />
                  {isPasswordSaving ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
