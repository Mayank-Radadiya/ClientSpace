import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties } from "react";

type FirstClientAddedEmailProps = {
  clientCompanyName: string;
  clientContactName: string;
  clientEmail: string;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clientspace.app";

export function FirstClientAddedEmail({
  clientCompanyName,
  clientContactName,
  clientEmail,
}: FirstClientAddedEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        Congratulations! Your first client, {clientCompanyName}, is now on
        ClientSpace.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientSpace</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>
              🎉 Great job! Your first client is in.
            </Heading>

            <Text style={paragraph}>
              You've successfully added <strong>{clientCompanyName}</strong> to
              your workspace. This is the first step toward managing your client
              relationships, projects, and invoices seamlessly.
            </Text>

            <Section style={detailsContainer}>
              <Heading style={detailsTitle}>Client Details</Heading>

              <Text style={detailRow}>
                <span style={detailLabel}>Company:</span>
                <span style={detailValue}>{clientCompanyName}</span>
              </Text>

              <Text style={detailRow}>
                <span style={detailLabel}>Contact:</span>
                <span style={detailValue}>{clientContactName}</span>
              </Text>

              <Text style={detailRow}>
                <span style={detailLabel}>Email:</span>
                <span style={detailValue}>{clientEmail}</span>
              </Text>
            </Section>

            <Text style={paragraph}>
              You can now set up projects, issue invoices, and securely share
              files with them directly from your dashboard.
            </Text>

            <Section style={buttonContainer}>
              <Button href={`${baseUrl}/dashboard`} style={button}>
                Go to Dashboard
              </Button>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              ClientSpace Inc. • 123 Business Avenue, Suite 100 • New York, NY
              10001
            </Text>
            <Text style={footerText}>
              You are receiving this confirmation email because you added your
              first client on ClientSpace.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: CSSProperties = {
  backgroundColor: "#f1f5f9",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
  padding: "40px 0",
};

const container: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: CSSProperties = {
  backgroundColor: "#0f172a",
  padding: "32px 40px",
  textAlign: "center",
};

const logoText: CSSProperties = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: 0,
};

const content: CSSProperties = {
  padding: "40px",
};

const heading: CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const paragraph: CSSProperties = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const detailsContainer: CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
};

const detailsTitle: CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  margin: "0 0 16px",
};

const detailRow: CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const detailLabel: CSSProperties = {
  color: "#64748b",
  display: "inline-block",
  fontWeight: "500",
  minWidth: "80px",
};

const detailValue: CSSProperties = {
  color: "#0f172a",
  fontWeight: "600",
};

const buttonContainer: CSSProperties = {
  margin: "32px 0 0",
  textAlign: "center",
};

const button: CSSProperties = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const divider: CSSProperties = {
  borderColor: "#e2e8f0",
  margin: 0,
};

const footer: CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "32px 40px",
  textAlign: "center",
};

const footerText: CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};
