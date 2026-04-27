import Link from "next/link";
import { ArrowRight, Building2, LifeBuoy, MonitorCog, UserRoundCheck, UsersRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getPlatformOverviewMetrics } from "@/lib/db/platform";

const cards = [
  { key: "companies", icon: Building2, label: "Companies" },
  { key: "totalUsers", icon: UsersRound, label: "Users" },
  { key: "pendingUsers", icon: UserRoundCheck, label: "Pending approvals" },
  { key: "supportTickets", icon: LifeBuoy, label: "Open escalations" },
] as const;

export default async function PlatformOverviewPage() {
  const metrics = await getPlatformOverviewMetrics();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Controller"
        description="Manage the website, onboard client companies, and keep platform access organized from one internal workspace."
        action={
          <Link href="/platform/content">
            <Button type="button">
              <MonitorCog className="h-4 w-4" />
              Open website manager
            </Button>
          </Link>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = metrics[card.key];

          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <CardTitle className="mt-3 text-4xl font-bold text-[#111827]">{value}</CardTitle>
                </div>
                <div className="rounded-xl border border-[#C9A646]/25 bg-[#C9A646]/12 p-3 text-[#B8933A]">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-[linear-gradient(135deg,#0F172A_0%,#18243d_100%)] text-white shadow-[0_26px_60px_-36px_rgba(15,23,42,0.8)]">
          <CardHeader className="border-b border-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A646]">
              Start here
            </p>
            <CardTitle className="mt-2 text-2xl font-bold text-white">
              The platform dashboard is now split the right way
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-200">
            <p>
              Website-wide controls now live here, separate from company admins. That keeps tenant workspaces cleaner and gives your client a much simpler place to manage public pages.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Website updates</p>
                <p className="mt-1 text-xs text-slate-300">Edit copy, images, contact info, and footer details.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Client companies</p>
                <p className="mt-1 text-xs text-slate-300">Add and maintain tenant records without touching code.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">User access</p>
                <p className="mt-1 text-xs text-slate-300">Review roles, approvals, and company assignments in one place.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recommended workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="font-semibold text-[#111827]">1. Review website content</p>
              <p className="mt-1">Update headlines, images, contact details, and footer links before sharing the site.</p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="font-semibold text-[#111827]">2. Confirm support email verification</p>
              <p className="mt-1">Make sure each client company verifies the support email and completes the first admin setup.</p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="font-semibold text-[#111827]">3. Verify user access</p>
              <p className="mt-1">Make sure admins and employees are in the correct role before handoff.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Client companies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Create client records, track verification status, resend onboarding links, and keep signup rules aligned.
            </p>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-[#B8933A]" href="/platform/companies">
              Open client companies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Users and access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Review users across companies, handle pending access, and correct tenant-side roles when needed.
            </p>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-[#B8933A]" href="/platform/people">
              Open users and access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Website content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Update the public website copy, visuals, and contact details without exposing those controls to company admins.
            </p>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-[#B8933A]" href="/platform/content">
              Open website content
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Help & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Review issues escalated by company admins, track progress, and close or archive them once handled.
            </p>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-[#B8933A]" href="/platform/support">
              Open help queue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
