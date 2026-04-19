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

export interface NewCommentEmailProps {
  authorName: string;
  commentBody: string;
  assetName: string;
  projectName: string;
  orgName: string;
  orgLogoUrl?: string;
  commentUrl: string;
}

export function NewCommentEmail({
  authorName,
  commentBody,
  assetName,
  projectName,
  orgName,
  commentUrl,
}: NewCommentEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>New comment on {assetName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={kicker}>{orgName}</Text>
            <Heading style={heading}>New comment on {assetName}</Heading>
            <Text style={paragraph}>
              <strong>{authorName}</strong> commented in <strong>{projectName}</strong>.
            </Text>
            <Section style={quoteWrap}>
              <Text style={quote}>{commentBody}</Text>
            </Section>
            <Section style={buttonWrap}>
              <Button href={commentUrl} style={button}>
                View Comment
              </Button>
            </Section>
          </Section>
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              You are receiving this email from ClientSpace.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NewCommentEmail;

const main: CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  padding: "24px 0",
};

const container: CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
};

const content: CSSProperties = { padding: "24px 28px" };

const kicker: CSSProperties = { margin: 0, color: "#64748b", fontSize: "12px" };

const heading: CSSProperties = {
  margin: "8px 0 12px",
  fontSize: "22px",
  color: "#0f172a",
};

const paragraph: CSSProperties = {
  margin: "0 0 12px",
  color: "#334155",
  fontSize: "15px",
};

const quoteWrap: CSSProperties = {
  borderLeft: "4px solid #2563eb",
  background: "#f8fafc",
  padding: "10px 12px",
  marginTop: "8px",
};

const quote: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "14px",
  lineHeight: "1.55",
};

const buttonWrap: CSSProperties = { marginTop: "18px" };

const button: CSSProperties = {
  background: "#2563eb",
  color: "#fff",
  borderRadius: "8px",
  textDecoration: "none",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "600",
};

const divider: CSSProperties = { borderColor: "#e2e8f0", margin: 0 };
const footer: CSSProperties = { padding: "14px 28px 20px" };
const footerText: CSSProperties = { margin: 0, color: "#94a3b8", fontSize: "12px" };
