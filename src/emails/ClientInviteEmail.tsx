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

type ClientInviteEmailProps = {
  contactName: string;
  companyName: string;
  inviterName: string;
  inviteUrl: string;
};

export function ClientInviteEmail({
  contactName,
  companyName,
  inviterName,
  inviteUrl,
}: ClientInviteEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>You have been invited to {inviterName}'s portal.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{inviterName}</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>
              You're invited to join {inviterName}
            </Heading>

            <Text style={paragraph}>Hi {contactName},</Text>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to access their
              secure client portal on ClientSpace.
            </Text>
            <Text style={paragraph}>
              You'll be able to view projects, manage invoices, and securely
              share files all in one place. Click the button below to accept
              your invitation and finish setting up your account.
            </Text>

            <Section style={buttonContainer}>
              <Button href={inviteUrl} style={button}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={muted}>
              This invitation link expires in <strong>72 hours</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              ClientSpace Inc. • 123 Business Avenue, Suite 100 • New York, NY
              10001
            </Text>
            <Text style={footerText}>
              If you didn't expect this invitation, you can safely ignore this
              email.
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
  margin: "0 0 20px",
};

const buttonContainer: CSSProperties = {
  margin: "32px 0 24px",
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

const muted: CSSProperties = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: 0,
  textAlign: "center",
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
