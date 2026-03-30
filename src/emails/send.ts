import { Resend } from "resend";
import { ClientInviteEmail } from "./ClientInviteEmail";
import { FirstClientAddedEmail } from "./FirstClientAddedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendClientInviteOptions = {
  to: string;
  contactName: string;
  companyName: string;
  inviterName: string;
  inviteUrl: string;
};

type SendFirstClientAddedOptions = {
  to: string;
  clientCompanyName: string;
  clientContactName: string;
  clientEmail: string;
};

export async function sendClientInviteEmail(opts: SendClientInviteOptions) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const fromEmail = "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: opts.to,
    subject: `You've been invited to ${opts.companyName}'s portal`,
    react: ClientInviteEmail({
      contactName: opts.contactName,
      companyName: opts.companyName,
      inviterName: opts.inviterName,
      inviteUrl: opts.inviteUrl,
    }),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }
}

export async function sendFirstClientAddedEmail(
  opts: SendFirstClientAddedOptions,
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const fromEmail =
    process.env.ONBOARDING_FROM_EMAIL ||
    process.env.INVITE_FROM_EMAIL ||
    "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: opts.to,
    subject: "Your first client has been added",
    react: FirstClientAddedEmail({
      clientCompanyName: opts.clientCompanyName,
      clientContactName: opts.clientContactName,
      clientEmail: opts.clientEmail,
    }),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }
}
