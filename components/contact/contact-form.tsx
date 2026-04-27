"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactRequestSchema, type ContactRequestInput } from "@/lib/validation/schemas";

export function ContactForm({
  privacyNote,
}: {
  privacyNote: string;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<ContactRequestInput>({
    defaultValues: {
      company: "",
      email: "",
      message: "",
      name: "",
    },
    resolver: zodResolver(contactRequestSchema),
  });

  async function onSubmit(values: ContactRequestInput) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send your message right now.");
      }

      form.reset();
      setSuccessMessage("Message sent successfully. Our team will review it and reply to your email.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send your message right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#111827]" htmlFor="contact-name">
            Name
          </label>
          <Input id="contact-name" autoComplete="name" {...form.register("name")} />
          <p className="min-h-4 text-xs font-medium text-rose-600">
            {form.formState.errors.name?.message}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#111827]" htmlFor="contact-email">
            Email
          </label>
          <Input
            id="contact-email"
            autoComplete="email"
            type="email"
            {...form.register("email")}
          />
          <p className="min-h-4 text-xs font-medium text-rose-600">
            {form.formState.errors.email?.message}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#111827]" htmlFor="contact-company">
          Company
        </label>
        <Input id="contact-company" autoComplete="organization" {...form.register("company")} />
        <p className="min-h-4 text-xs font-medium text-rose-600">
          {form.formState.errors.company?.message}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#111827]" htmlFor="contact-message">
          Message
        </label>
        <Textarea id="contact-message" className="min-h-36" {...form.register("message")} />
        <p className="min-h-4 text-xs font-medium text-rose-600">
          {form.formState.errors.message?.message}
        </p>
      </div>

      {errorMessage ? (
        <p className="app-status-banner app-status-banner-error">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="app-status-banner app-status-banner-success">
          {successMessage}
        </p>
      ) : null}

      <Button
        className="h-12 w-full shadow-[0_10px_22px_rgba(201,166,70,0.24)]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>

      <p className="text-center text-xs font-semibold text-[#6B7280]">
        {privacyNote}
      </p>
    </form>
  );
}
