export interface SiteImageContent {
  alt: string;
  url: string;
}

export interface SiteLinkContent {
  href: string;
  label: string;
}

export interface SiteFeatureItem {
  description: string;
  title: string;
}

export interface SiteStepItem {
  description: string;
  title: string;
}

export interface SiteSocialLink {
  label: string;
  url: string;
}

export interface SiteContent {
  header: {
    brand: {
      subtitle: string;
      title: string;
    };
    navLinks: SiteLinkContent[];
    portalCta: SiteLinkContent;
  };
  about: {
    feature: SiteFeatureItem;
    hero: {
      description: string;
      image: SiteImageContent;
      kicker: string;
      title: string;
    };
    image: SiteImageContent;
    note: SiteFeatureItem;
    paragraphs: string[];
    strengths: string[];
  };
  contact: {
    details: {
      address: string;
      email: string;
      phone: string;
      privacyNote: string;
      responseTime: string;
      supportNote: string;
      whatsApp: string;
    };
    hero: {
      description: string;
      image: SiteImageContent;
      kicker: string;
      title: string;
    };
    request: {
      description: string;
      kicker: string;
      primaryCta: SiteLinkContent;
      secondaryCta: SiteLinkContent;
      title: string;
    };
  };
  footer: {
    address: string;
    backgroundImage: SiteImageContent;
    email: string;
    legalLine: string;
    navLinks: SiteLinkContent[];
    phone: string;
    responseNote: string;
    socials: SiteSocialLink[];
    tagline: string;
    whatsApp: string;
  };
  home: {
    coverage: {
      description: string;
      highlights: SiteFeatureItem[];
      image: SiteImageContent;
      imageLabel: string;
      kicker: string;
      title: string;
    };
    hero: {
      description: string;
      image: SiteImageContent;
      kicker: string;
      primaryCta: SiteLinkContent;
      secondaryCta: SiteLinkContent;
      title: string;
      trustLine: string;
    };
    workflow: {
      description: string;
      kicker: string;
      steps: SiteStepItem[];
      title: string;
    };
  };
  services: {
    hero: {
      description: string;
      image: SiteImageContent;
      kicker: string;
      title: string;
    };
    services: SiteFeatureItem[];
    trust: {
      description: string;
      kicker: string;
      points: SiteFeatureItem[];
      title: string;
    };
  };
}
