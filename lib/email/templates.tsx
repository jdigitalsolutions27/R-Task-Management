import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface NotificationEmailProps {
  actionLabel?: string;
  actionUrl?: string;
  detail?: string;
  headline: string;
  summary: string;
}

export function NotificationEmail({
  actionLabel,
  actionUrl,
  detail,
  headline,
  summary,
}: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{headline}</Preview>
      <Body
        style={{
          backgroundColor: "#f7f5f2",
          color: "#1f2937",
          fontFamily: "Arial, sans-serif",
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d6d3d1",
            borderRadius: "8px",
            margin: "0 auto",
            maxWidth: "560px",
            padding: "32px",
          }}
        >
          <Heading style={{ color: "#334155", fontSize: "24px", marginTop: 0 }}>
            {headline}
          </Heading>
          <Text style={{ fontSize: "15px", lineHeight: "24px", marginBottom: "16px" }}>
            {summary}
          </Text>
          {detail ? (
            <Section
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <Text style={{ fontSize: "14px", lineHeight: "22px", margin: 0 }}>{detail}</Text>
            </Section>
          ) : null}
          {actionUrl && actionLabel ? (
            <Button
              href={actionUrl}
              style={{
                backgroundColor: "#6b7d6d",
                borderRadius: "6px",
                color: "#ffffff",
                display: "inline-block",
                fontSize: "14px",
                fontWeight: 600,
                padding: "12px 18px",
                textDecoration: "none",
              }}
            >
              {actionLabel}
            </Button>
          ) : null}
          <Text style={{ fontSize: "13px", lineHeight: "20px", marginTop: "24px" }}>
            R-Task Realty &amp; Property Management Solutions
          </Text>
          {actionUrl ? (
            <Text style={{ color: "#64748b", fontSize: "12px", lineHeight: "18px" }}>
              If the button does not work, copy this link into your browser:{" "}
              <Link href={actionUrl}>{actionUrl}</Link>
            </Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

