import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Html,
  Link,
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
      <Head>
        <Font
          fontFamily="Sora"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/sora/v12/xMQOuFFYT72X5wkB_18qmnndmSdSn3-KIwNhBti0.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K6z9mXgjU0.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        {inviterName} has invited you to the {companyName} client portal —
        accept your invitation inside.
      </Preview>

      <Body style={body}>
        <Container style={wrapper}>

          {/* ── Brand Header ─────────────────────────────────── */}
          <Section style={header}>
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              cellPadding={0}
              cellSpacing={0}
            >
              <tr>
                <td style={headerLeft}>
                  {/* Geometric mark + wordmark */}
                  <span style={brandMark}>◆</span>
                  <span style={brandWordmark}>ClientSpace</span>
                </td>
                <td style={headerRight}>
                  <span style={headerBadge}>Client Invite</span>
                </td>
              </tr>
            </table>
          </Section>

          {/* ── Separator ────────────────────────────────────── */}
          <div style={topRule} />

          {/* ── Hero Block ───────────────────────────────────── */}
          <Section style={hero}>
            <Text style={eyebrow}>You&apos;re invited</Text>
            <Text style={headline}>
              Access your portal at{" "}
              <span style={headlineAccent}>{companyName}</span>
            </Text>
            <Text style={subtext}>
              Hi {contactName} — <strong style={strong}>{inviterName}</strong>{" "}
              has granted you access to the <strong style={strong}>{companyName}</strong>{" "}
              client portal on ClientSpace. Everything you need — files,
              invoices, project updates — is one click away.
            </Text>
          </Section>

          {/* ── CTA ──────────────────────────────────────────── */}
          <Section style={ctaSection}>
            <Button href={inviteUrl} style={ctaButton}>
              Accept Invitation →
            </Button>
          </Section>

          {/* ── Info Row ─────────────────────────────────────── */}
          <Section style={infoRow}>
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              cellPadding={0}
              cellSpacing={0}
            >
              <tr>
                <td style={infoCell}>
                  <Text style={infoLabel}>Invited by</Text>
                  <Text style={infoValue}>{inviterName}</Text>
                </td>
                <td style={infoCellDivider} />
                <td style={infoCell}>
                  <Text style={infoLabel}>Portal</Text>
                  <Text style={infoValue}>{companyName}</Text>
                </td>
                <td style={infoCellDivider} />
                <td style={infoCell}>
                  <Text style={infoLabel}>Expires</Text>
                  <Text style={infoValue}>48 hours</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* ── Fallback Link ────────────────────────────────── */}
          <Section style={fallbackSection}>
            <Text style={fallbackLabel}>Can&apos;t click the button? Copy this link:</Text>
            <Link href={inviteUrl} style={fallbackLink}>
              {inviteUrl}
            </Link>
          </Section>

          {/* ── Bottom Rule ──────────────────────────────────── */}
          <div style={bottomRule} />

          {/* ── Footer ───────────────────────────────────────── */}
          <Section style={footer}>
            <Text style={footerText}>
              If you didn&apos;t expect this email, you can safely ignore it.
              This invitation will expire automatically.
            </Text>
            <Text style={footerMeta}>
              ClientSpace &middot;{" "}
              <Link href="https://clientspace.qzz.io" style={footerLink}>
                clientspace.qzz.io
              </Link>
              {" "}&middot; 548 Market St, PMB 72285, San Francisco, CA 94104
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ─── Design Tokens ─────────────────────────────────────────────────────────────
// Aesthetic: Luxury Minimal / Editorial
// DFII: 14 — Sora display, DM Sans body, deep indigo accent, wide air, monochrome base
// Differentiation: geometric dot brand mark + wide-letterspace eyebrow + info-row metadata strip

const FONT_DISPLAY = "'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_BODY = "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR_INK = "#0d0d12";
const COLOR_ACCENT = "#5b5ef7";       // deep indigo — single accent
const COLOR_SURFACE = "#ffffff";
const COLOR_MUTED = "#6b7280";
const COLOR_FAINT = "#f4f4f6";
const COLOR_BORDER = "#e8e8ed";
const COLOR_RULE = "#e0e0e8";

// ─── Structural ────────────────────────────────────────────────────────────────

const body = {
  backgroundColor: COLOR_FAINT,
  fontFamily: FONT_BODY,
  margin: 0,
  padding: "48px 20px 64px",
  WebkitTextSizeAdjust: "100%",
  msTextSizeAdjust: "100%",
} as CSSProperties;

const wrapper: CSSProperties = {
  backgroundColor: COLOR_SURFACE,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  overflow: "hidden",
};

// ─── Header ────────────────────────────────────────────────────────────────────

const header: CSSProperties = {
  padding: "28px 40px 26px",
};

const headerLeft: CSSProperties = {
  verticalAlign: "middle",
};

const headerRight: CSSProperties = {
  verticalAlign: "middle",
  textAlign: "right",
};

const brandMark: CSSProperties = {
  color: COLOR_ACCENT,
  fontSize: "11px",
  marginRight: "7px",
  verticalAlign: "middle",
};

const brandWordmark: CSSProperties = {
  color: COLOR_INK,
  fontFamily: FONT_DISPLAY,
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  verticalAlign: "middle",
};

const headerBadge: CSSProperties = {
  backgroundColor: COLOR_FAINT,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: "100px",
  color: COLOR_MUTED,
  fontFamily: FONT_BODY,
  fontSize: "11px",
  fontWeight: 400,
  letterSpacing: "0.06em",
  padding: "4px 12px",
  textTransform: "uppercase",
};

// ─── Rules ─────────────────────────────────────────────────────────────────────

const topRule: CSSProperties = {
  backgroundColor: COLOR_ACCENT,
  height: "2px",
  margin: "0 40px",
};

const bottomRule: CSSProperties = {
  backgroundColor: COLOR_RULE,
  height: "1px",
  margin: "0 40px",
};

// ─── Hero ──────────────────────────────────────────────────────────────────────

const hero: CSSProperties = {
  padding: "40px 40px 0",
};

const eyebrow: CSSProperties = {
  color: COLOR_ACCENT,
  fontFamily: FONT_BODY,
  fontSize: "11px",
  fontWeight: 400,
  letterSpacing: "0.14em",
  margin: "0 0 14px",
  textTransform: "uppercase",
};

const headline: CSSProperties = {
  color: COLOR_INK,
  fontFamily: FONT_DISPLAY,
  fontSize: "26px",
  fontWeight: 700,
  lineHeight: "1.25",
  margin: "0 0 20px",
};

const headlineAccent: CSSProperties = {
  color: COLOR_ACCENT,
};

const subtext: CSSProperties = {
  color: COLOR_MUTED,
  fontFamily: FONT_BODY,
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "0 0 0",
};

const strong: CSSProperties = {
  color: COLOR_INK,
  fontWeight: 600,
};

// ─── CTA ───────────────────────────────────────────────────────────────────────

const ctaSection: CSSProperties = {
  padding: "32px 40px 32px",
};

const ctaButton: CSSProperties = {
  backgroundColor: COLOR_INK,
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontFamily: FONT_BODY,
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  padding: "14px 32px",
  textDecoration: "none",
};

// ─── Info Row ──────────────────────────────────────────────────────────────────

const infoRow: CSSProperties = {
  backgroundColor: COLOR_FAINT,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: "8px",
  margin: "0 40px 32px",
  padding: "20px 24px",
};

const infoCell: CSSProperties = {
  verticalAlign: "top",
  width: "33%",
};

const infoCellDivider: CSSProperties = {
  backgroundColor: COLOR_BORDER,
  width: "1px",
};

const infoLabel: CSSProperties = {
  color: COLOR_MUTED,
  fontFamily: FONT_BODY,
  fontSize: "10px",
  fontWeight: 400,
  letterSpacing: "0.1em",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const infoValue: CSSProperties = {
  color: COLOR_INK,
  fontFamily: FONT_BODY,
  fontSize: "13px",
  fontWeight: 600,
  margin: 0,
};

// ─── Fallback ──────────────────────────────────────────────────────────────────

const fallbackSection: CSSProperties = {
  padding: "0 40px 36px",
};

const fallbackLabel: CSSProperties = {
  color: COLOR_MUTED,
  fontFamily: FONT_BODY,
  fontSize: "12px",
  margin: "0 0 6px",
};

const fallbackLink: CSSProperties = {
  color: COLOR_ACCENT,
  fontFamily: FONT_BODY,
  fontSize: "12px",
  textDecoration: "underline",
  wordBreak: "break-all",
};

// ─── Footer ────────────────────────────────────────────────────────────────────

const footer: CSSProperties = {
  padding: "28px 40px 32px",
};

const footerText: CSSProperties = {
  color: COLOR_MUTED,
  fontFamily: FONT_BODY,
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const footerMeta: CSSProperties = {
  color: "#adb5bd",
  fontFamily: FONT_BODY,
  fontSize: "11px",
  lineHeight: "1.5",
  margin: 0,
};

const footerLink: CSSProperties = {
  color: "#adb5bd",
  textDecoration: "underline",
};
