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

type AssetStatus = "approved" | "changes_requested";

export interface AssetStatusEmailProps {
  status: AssetStatus;
  actorName: string;
  assetName: string;
  projectName: string;
  actionUrl: string;
  bodyHtml: string;
}

const STYLES = {
  approved: {
    label: "Approved",
    accent: "#16a34a",
  },
  changes_requested: {
    label: "Changes Requested",
    accent: "#ea580c",
  },
} as const;

export function AssetStatusEmail({
  status,
  actorName,
  assetName,
  projectName,
  actionUrl,
  bodyHtml,
}: AssetStatusEmailProps) {
  const style = STYLES[status];

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {status === "approved" ? "File approved" : "Changes requested"}:{" "}
        {assetName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>ClientSpace</Text>
          </Section>

          <Section style={content}>
            <div
              style={{
                ...pill,
                color: style.accent,
                backgroundColor: `${style.accent}1a`,
                borderColor: `${style.accent}33`,
              }}
            >
              {style.label}
            </div>

            <Heading style={heading}>{assetName}</Heading>

            <Text style={paragraph}>
              <strong>{actorName}</strong>{" "}
              {status === "approved" ? "approved" : "requested changes for"}{" "}
              this file in <strong>{projectName}</strong>.
            </Text>

            <Text
              style={paragraph}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            <Section style={buttonContainer}>
              <Button href={actionUrl} style={button}>
                Open Project
              </Button>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You are receiving this email because you are assigned to this
              project.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AssetStatusEmail;

const main: CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
  padding: "32px 0",
};

const container: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header: CSSProperties = {
  backgroundColor: "#0f172a",
  padding: "24px 32px",
};

const logoText: CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "700",
  margin: 0,
};

const content: CSSProperties = {
  padding: "28px 32px 20px",
};

const pill: CSSProperties = {
  display: "inline-block",
  border: "1px solid transparent",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  lineHeight: 1,
  marginBottom: "14px",
  padding: "8px 12px",
};

const heading: CSSProperties = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 14px",
};

const paragraph: CSSProperties = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 14px",
};

const buttonContainer: CSSProperties = {
  margin: "24px 0 12px",
};

const button: CSSProperties = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 18px",
  textDecoration: "none",
};

const divider: CSSProperties = {
  borderColor: "#e2e8f0",
  margin: 0,
};

const footer: CSSProperties = {
  padding: "16px 32px 24px",
};

const footerText: CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
};
