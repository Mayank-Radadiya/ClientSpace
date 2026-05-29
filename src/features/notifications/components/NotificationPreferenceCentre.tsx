"use client";

// NotificationPreferenceCentre
// ─────────────────────────────────────────────────────────────────────────────
// Full-page preference matrix for controlling which notification channels
// are active for each event type. Groups events by category (Invoices, Assets…).
//
// Features:
//   - Grouped event matrix with channel toggle switches
//   - Autosave on toggle (debounced 800ms) — no submit button needed
//   - Slack integration: connect / test / disconnect webhook
//   - SMS section: requires user phone + opt-in (shown greyed if no phone on file)
//   - Accessible: aria-labels on all toggles, focus-visible ring

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, Loader2, Mail, MessageSquare, Slack, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  EVENT_LABELS,
  DEFAULT_PREFERENCES,
  SMS_ELIGIBLE_EVENTS,
  type NotificationEventType,
  type ChannelPreference,
} from "@/features/notifications/events";

// ─── Types ────────────────────────────────────────────────────────────────────

type PrefsMap = Record<string, ChannelPreference>;

type Props = {
  initialPreferences: PrefsMap;
  slackConnected: boolean;
};

// ─── Channel metadata ─────────────────────────────────────────────────────────

const CHANNELS: { key: keyof ChannelPreference; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "in_app", label: "In-app",  Icon: Bell },
  { key: "email",  label: "Email",   Icon: Mail },
  { key: "slack",  label: "Slack",   Icon: Slack },
  { key: "sms",    label: "SMS",     Icon: Smartphone },
];

// Group events by category for the matrix UI
const CATEGORIES = Array.from(
  new Set(Object.values(EVENT_LABELS).map((e) => e.category)),
);

function getEventsByCategory(category: string): NotificationEventType[] {
  return (Object.entries(EVENT_LABELS) as [NotificationEventType, typeof EVENT_LABELS[NotificationEventType]][])
    .filter(([, meta]) => meta.category === category)
    .map(([type]) => type);
}

// ─── Preference matrix component ──────────────────────────────────────────────

export function NotificationPreferenceCentre({ initialPreferences, slackConnected }: Props) {
  const [prefs, setPrefs] = useState<PrefsMap>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [slackUrl, setSlackUrl] = useState("");
  const [isSlackConnected, setIsSlackConnected] = useState(slackConnected);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePrefs = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      setSaving(false);
      setSavedAt(new Date());
    },
    onError: (err) => {
      setSaving(false);
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const updateSlack = trpc.notifications.updateSlackWebhook.useMutation({
    onSuccess: () => {
      toast.success(isSlackConnected ? "Slack disconnected." : "Slack connected!");
      setIsSlackConnected((prev) => !prev);
      setSlackUrl("");
    },
    onError: (err) => toast.error(`Slack error: ${err.message}`),
  });

  const testSlack = trpc.notifications.testSlackWebhook.useMutation({
    onSuccess: () => toast.success("Test message sent to Slack!"),
    onError: (err) => toast.error(`Test failed: ${err.message}`),
  });

  // Debounced autosave
  const scheduleAutosave = useCallback((updated: PrefsMap) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    debounceRef.current = setTimeout(() => {
      updatePrefs.mutate({ preferences: updated });
    }, 800);
  }, [updatePrefs]);

  function handleToggle(type: NotificationEventType, channel: keyof ChannelPreference, value: boolean) {
    const current = prefs[type] ?? DEFAULT_PREFERENCES[type];
    const updated: PrefsMap = {
      ...prefs,
      [type]: { ...current, [channel]: value },
    };
    setPrefs(updated);
    scheduleAutosave(updated);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notification preferences</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose which events notify you and through which channels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
          {!saving && savedAt && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Matrix per category */}
      {CATEGORIES.map((category) => {
        const events = getEventsByCategory(category);
        return (
          <div key={category} className="rounded-xl border">
            {/* Category header */}
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">{category}</h2>
            </div>

            {/* Channel header row */}
            <div className="bg-muted/30 grid grid-cols-[1fr_repeat(4,_64px)] border-b px-5 py-2">
              <span className="text-muted-foreground text-xs font-medium">Event</span>
              {CHANNELS.map(({ key, label, Icon }) => (
                <div key={key} className="flex flex-col items-center gap-0.5">
                  <Icon className="text-muted-foreground h-3.5 w-3.5" />
                  <span className="text-muted-foreground text-[10px] font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Event rows */}
            {events.map((type, idx) => {
              const meta = EVENT_LABELS[type];
              const current = prefs[type] ?? DEFAULT_PREFERENCES[type];
              const isLast = idx === events.length - 1;

              return (
                <div
                  key={type}
                  className={cn(
                    "grid grid-cols-[1fr_repeat(4,_64px)] items-center px-5 py-3",
                    !isLast && "border-b",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-muted-foreground text-xs">{meta.description}</p>
                  </div>

                  {CHANNELS.map(({ key }) => {
                    const isSmsChannel = key === "sms";
                    const isSmsEligible = SMS_ELIGIBLE_EVENTS.has(type);
                    const isDisabled = isSmsChannel && !isSmsEligible;

                    return (
                      <div key={key} className="flex items-center justify-center">
                        <Switch
                          id={`pref-${type}-${key}`}
                          checked={current[key]}
                          disabled={isDisabled}
                          onCheckedChange={(val) => handleToggle(type, key, val)}
                          aria-label={`${meta.label} via ${key}`}
                          className={isDisabled ? "opacity-30 cursor-not-allowed" : ""}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ─── Slack Integration ─────────────────────────────────────────────── */}
      <div className="rounded-xl border">
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Slack className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Slack integration</h2>
            <Badge variant={isSlackConnected ? "secondary" : "outline"} className="ml-auto">
              {isSlackConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Post notification events to a Slack channel via an Incoming Webhook.
            Slack messages contain only the notification title and a link — no financial data or PII.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          {isSlackConnected ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSlack.mutate()}
                disabled={testSlack.isPending}
                id="slack-test-btn"
              >
                {testSlack.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Send test message
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => updateSlack.mutate({ webhookUrl: "" })}
                disabled={updateSlack.isPending}
                id="slack-disconnect-btn"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="slack-webhook-url" className="text-xs">Incoming Webhook URL</Label>
                <Input
                  id="slack-webhook-url"
                  type="url"
                  placeholder="https://hooks.slack.com/services/T.../B.../..."
                  value={slackUrl}
                  onChange={(e) => setSlackUrl(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={() => updateSlack.mutate({ webhookUrl: slackUrl })}
                disabled={updateSlack.isPending || !slackUrl.startsWith("https://hooks.slack.com/")}
                id="slack-connect-btn"
              >
                {updateSlack.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Connect
              </Button>
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            Create a webhook at{" "}
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              api.slack.com/messaging/webhooks
            </a>
            .
          </p>
        </div>
      </div>

      {/* ─── SMS Section ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border">
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <h2 className="text-sm font-semibold">SMS notifications</h2>
            <Badge variant="outline" className="ml-auto text-[10px]">High-priority only</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            SMS is only sent for high-priority events (overdue invoices, missed milestones, critical project health).
            Maximum 5 SMS per hour. Messages contain the event title only — no financial amounts or contract details.
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-muted-foreground text-sm">
            To enable SMS, add your phone number in{" "}
            <a href="/settings" className="text-primary underline underline-offset-2">
              Account settings
            </a>{" "}
            and opt in to SMS communications.
          </p>
        </div>
      </div>
    </div>
  );
}
