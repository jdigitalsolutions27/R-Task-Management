import type { SiteContent } from "@/types/site-content";

export const defaultSiteContent: SiteContent = {
  header: {
    portalCta: {
      href: "/login",
      label: "Client Portal",
    },
  },
  about: {
    feature: {
      description: "Private files, controlled approvals, and clear operational records.",
      title: "Built for sensitive work",
    },
    hero: {
      description:
        "A secure, structured platform for property workflows, approvals, inspections, reporting, and compliance tracking.",
      image: {
        alt: "Professional office corridor representing organized property operations",
        url: "/about-hero.jpg",
      },
      kicker: "About R-Task",
      title: "About R-Task Realty & Property Management Solutions",
    },
    image: {
      alt: "Professional workspace for property management operations",
      url: "/about-team.jpg",
    },
    note: {
      description:
        "We created this platform to address the challenges of managing property workflows across multiple teams and locations. Our goal is to provide a reliable system that makes everyday operations simpler, more transparent, and more efficient.",
      title: "A Note from the Team",
    },
    paragraphs: [
      "R-Task Realty & Property Management Solutions provides a secure and structured platform for managing property-related workflows - from document approvals and inspections to reporting and compliance tracking.",
      "Built to simplify complex processes, the platform helps property managers, corporate teams, and field personnel stay organized, accountable, and connected through a centralized system.",
      "With a focus on reliability, data security, and operational efficiency, R-Task is designed to support real-world property management needs with clarity and confidence.",
    ],
    strengths: ["Structured workflows", "Secure client access", "Operational accountability"],
  },
  contact: {
    details: {
      address: "2801 Richmond Rd Texarkana, TX 75503, USA",
      email: "rtaskmanagement@gmail.com",
      phone: "+1 (501) 410-7833",
      privacyNote: "Your information is kept private and secure.",
      responseTime: "We respond within 24 hours",
      supportNote: "Your request is handled privately and routed to the right team for follow-up.",
      whatsApp: "+1 (501) 410-7833",
    },
    hero: {
      description:
        "Whether you're managing multiple properties or coordinating inspections and reports, our platform is built to support your workflow.",
      image: {
        alt: "Professional meeting room for R-Task contact",
        url: "/contact-hero.jpg",
      },
      kicker: "Contact",
      title: "Get Started with R-Task Today",
    },
    request: {
      description:
        "Get in touch to request access, review your workflow needs, or learn how R-Task can support your property operations.",
      kicker: "Request access",
      primaryCta: { href: "/login", label: "Open Client Portal" },
      secondaryCta: { href: "/login", label: "Request Access" },
      title: "Talk to our team",
    },
  },
  footer: {
    address: "2801 Richmond Rd Texarkana, TX 75503, USA",
    backgroundImage: {
      alt: "Modern office building background for footer",
      url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=75",
    },
    email: "rtaskmanagement@gmail.com",
    phone: "+1 (501) 410-7833",
    responseNote: "We respond within 24 hours.",
    socials: [
      { label: "Facebook", url: "https://www.facebook.com/rtaskmanagement/" },
      { label: "LinkedIn", url: "https://www.linkedin.com/company/r-task-property-management-solutions/" },
      { label: "Instagram", url: "https://www.instagram.com/rtaskmanagement/" },
    ],
    tagline: "Secure property workflows, tenant-safe records, and audit-ready delivery.",
    whatsApp: "+1 (501) 410-7833",
  },
  home: {
    coverage: {
      description:
        "Each company operates in an isolated workspace with approval queues, inspection evidence, shopping reports, eviction tracking, and controlled access to private files.",
      highlights: [
        {
          description:
            "Files stay in private storage with signed access and immutable status history.",
          title: "Private evidence chain",
        },
        {
          description:
            "Corporate users manage approvals, employees upload files, and inspectors deliver field reporting.",
          title: "Role-aware execution",
        },
      ],
      image: {
        alt: "Modern residential property exterior",
        url: "/workflow-property-section.jpg",
      },
      imageLabel: "Property operations, organized",
      kicker: "Workflow coverage",
      title: "Built for property teams, field inspectors, and client stakeholders.",
    },
    hero: {
      description:
        "Upload documents, manage inspections, track approvals, and access reports - all in one secure client portal built for property teams and corporate clients.",
      image: {
        alt: "Modern apartment building for property management",
        url: "/hero-property-canvas.jpg",
      },
      kicker: "Property operations portal",
      primaryCta: { href: "/login", label: "Open Client Portal" },
      secondaryCta: { href: "/login", label: "Request Access" },
      title: "Secure Property Management Workflows in One Platform",
      trustLine: "Secure access. Role-based permissions. Audit-ready tracking.",
    },
    workflow: {
      description:
        "A simple workflow designed for property teams, inspectors, and client stakeholders.",
      kicker: "Workflow",
      steps: [
        {
          description:
            "Upload files, inspection reports, or supporting documents securely into your workspace.",
          title: "Upload & Submit",
        },
        {
          description:
            "Managers review submissions, approve or reject with comments, and maintain full audit tracking.",
          title: "Review & Approve",
        },
        {
          description:
            "Access approved files, completed reports, and downloadable records anytime from the client portal.",
          title: "Access & Deliver",
        },
      ],
      title: "How It Works",
    },
  },
  services: {
    hero: {
      description:
        "Built around real property management workflows - from document control to field reporting and compliance tracking.",
      image: {
        alt: "Commercial real estate towers for property management services",
        url: "/services-hero.jpg",
      },
      kicker: "Services",
      title: "What You Can Do",
    },
    services: [
      {
        description:
          "Securely upload, review, and approve files with full audit history and role-based access.",
        title: "File Approvals & Document Control",
      },
      {
        description:
          "Schedule inspections, upload reports and photo evidence, and track completion in real time.",
        title: "Property Inspections",
      },
      {
        description:
          "Publish detailed reports with supporting documents and video evidence for client access.",
        title: "Shopping & Compliance Reports",
      },
      {
        description:
          "Manage eviction cases from draft to completion with organized document packages and status tracking.",
        title: "Eviction Workflow Tracking",
      },
    ],
    trust: {
      description:
        "Designed to protect sensitive property data while ensuring full transparency across every workflow.",
      kicker: "Trust & Authority",
      points: [
        {
          description:
            "All files are stored in private, encrypted storage with controlled access and secure delivery.",
          title: "Secure Data Storage",
        },
        {
          description:
            "Each user only sees what they are authorized to access, ensuring complete data isolation across companies.",
          title: "Role-Based Access Control",
        },
        {
          description:
            "Every action is logged - from uploads to approvals - providing full visibility and accountability.",
          title: "Audit-Ready Tracking",
        },
        {
          description:
            "Built on modern cloud systems with backup and uptime reliability for uninterrupted access.",
          title: "Reliable Cloud Infrastructure",
        },
      ],
      title: "Built for Security, Reliability, and Accountability",
    },
  },
};
