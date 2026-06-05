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
      <Preview>You have been invited to ClientSpace.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientSpace</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>
              You're invited to join ClientSpace
            </Heading>

            <Text style={paragraph}>Hello {contactName},</Text>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to access their
              secure client portal on ClientSpace.
            </Text>
            <Text style={paragraph}>
              ClientSpace provides a centralized hub where you can seamlessly view your projects, manage invoices, and securely share files in one place.
            </Text>
            
            <Section style={buttonContainer}>
              <Button href={inviteUrl} style={button}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={muted}>
              For security purposes, this invitation link will expire in <strong>72 hours</strong>.
            </Text>
            <Hr style={contentDivider} />
            <Text style={subMuted}>
              If you have any questions, feel free to reach out to {inviterName} directly or reply to this email.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} ClientSpace Inc. All rights reserved.
            </Text>
            <Text style={footerText}>
              123 Business Avenue, Suite 100 • New York, NY 10001
            </Text>
            <Text style={footerText}>
              If you didn't expect this invitation, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
  padding: "40px 0",
};

const container: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "12px",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: CSSProperties = {
  backgroundColor: "#18181b",
  padding: "32px 40px",
  textAlign: "center",
  borderBottom: "4px solid #3b82f6",
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
  color: "#18181b",
  fontSize: "26px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  margin: "0 0 24px",
  textAlign: "center",
};

const paragraph: CSSProperties = {
  color: "#3f3f46",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const buttonContainer: CSSProperties = {
  margin: "32px 0",
  textAlign: "center",
};

const button: CSSProperties = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 32px",
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
};

const contentDivider: CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "32px 0 24px",
};

const muted: CSSProperties = {
  color: "#71717a",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: 0,
  textAlign: "center",
};

const subMuted: CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: 0,
};

const footer: CSSProperties = {
  backgroundColor: "#fafafa",
  padding: "32px 40px",
  textAlign: "center",
  borderTop: "1px solid #e4e4e7",
};

const footerText: CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};
