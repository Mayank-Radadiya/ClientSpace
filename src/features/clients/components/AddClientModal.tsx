"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, ChevronDown, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { inviteClientAction } from "../server/actions";

type AddClientModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

type ContactExtra = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
};

const INDUSTRIES = [
  "Technology", "Design", "Marketing", "Finance", "Healthcare",
  "Legal", "Education", "E-commerce", "Real Estate", "Other",
];

const PAYMENT_TERMS = [
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_60", label: "Net 60" },
  { value: "due_receipt", label: "Due on Receipt" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm font-[var(--font-data)] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-150 focus:border-primary focus:bg-primary/5 dark:focus:border-primary";
const SELECT_CLASS =
  "w-full appearance-none rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm font-[var(--font-data)] text-foreground outline-none transition-all duration-150 focus:border-primary cursor-pointer";
const LABEL_CLASS =
  "mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase font-[var(--font-data)]";
const SECTION_TITLE_CLASS =
  "mb-4 flex items-center gap-3 text-[11px] font-bold tracking-[0.2em] text-primary uppercase font-[var(--font-data)]";

function SectionDivider({ num, label }: { num: string; label: string }) {
  return (
    <div className={SECTION_TITLE_CLASS}>
      <span className="border-primary/30 text-primary flex h-5 w-5 items-center justify-center rounded-full border text-[9px]">
        {num}
      </span>
      {label}
      <div className="bg-primary/15 h-px flex-1" />
    </div>
  );
}

export function AddClientModal({ open, onClose, onSuccess, onError }: AddClientModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [extraContacts, setExtraContacts] = useState<ContactExtra[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sendInvite, setSendInvite] = useState(true);

  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [status, setStatus] = useState<"active" | "pending">("active");
  const [currency, setCurrency] = useState("USD");
  const [paymentTerms, setPaymentTerms] = useState("net_30");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Company name is required";
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,$/, "");
      if (newTag && !tags.includes(newTag)) {
        setTags((prev) => [...prev, newTag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function addContact() {
    setExtraContacts((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), firstName: "", lastName: "", email: "", phone: "", role: "" },
    ]);
  }

  function removeContact(id: string) {
    setExtraContacts((prev) => prev.filter((c) => c.id !== id));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setCompanyName(""); setWebsite(""); setIndustry("");
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setContactRole("");
    setStatus("active"); setCurrency("USD"); setPaymentTerms("net_30"); setNotes("");
    setTags([]); setTagInput(""); setExtraContacts([]); setLogoPreview(null);
    setErrors({}); setContactsOpen(false); setSendInvite(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await inviteClientAction({
        email: email.toLowerCase(),
        companyName,
        contactName: `${firstName} ${lastName}`.trim(),
      });
      if ("error" in result) {
        const msg = typeof result.error === "string" ? result.error : "Please fix the highlighted fields.";
        onError(msg);
      } else {
        resetForm();
        onClose();
        onSuccess(sendInvite ? `Invitation sent to ${email}` : `${companyName} added successfully`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-background border-border relative max-h-[85vh] w-full max-w-[600px] overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
              {/* Header */}
              <div className="border-border flex items-center justify-between border-b px-6 py-5">
                <h2 className="text-foreground text-2xl font-[var(--font-display)] font-extrabold tracking-tight">
                  Add Client
                </h2>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <form onSubmit={handleSubmit}>
                <div className="max-h-[calc(85vh-140px)] overflow-y-auto px-6 py-5 space-y-8">

                  {/* Section 1: Identity */}
                  <div>
                    <SectionDivider num="01" label="Identity" />
                    <div className="space-y-4">
                      <div>
                        <label className={LABEL_CLASS}>Company Name *</label>
                        <input
                          className={cn(INPUT_CLASS, "text-lg", errors.companyName && "border-destructive")}
                          placeholder="e.g., Acme Corporation"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          onBlur={() => validate()}
                        />
                        {errors.companyName && <p className="text-destructive mt-1 text-[11px]">{errors.companyName}</p>}
                        {companyName && (
                          <p className="text-muted-foreground/60 mt-1.5 text-[10px] font-[var(--font-data)]">
                            client/{companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLASS}>Website</label>
                          <div className="relative">
                            <span className="text-muted-foreground/60 absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-[var(--font-data)]">https://</span>
                            <input
                              className={cn(INPUT_CLASS, "pl-16")}
                              placeholder="acme.com"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Industry</label>
                          <div className="relative">
                            <select
                              className={SELECT_CLASS}
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                            >
                              <option value="">Select industry</option>
                              {INDUSTRIES.map((i) => (
                                <option key={i} value={i}>{i}</option>
                              ))}
                            </select>
                            <ChevronDown className="text-muted-foreground/60 pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>

                      {/* Logo upload */}
                      <div>
                        <label className={LABEL_CLASS}>Company Logo / Avatar</label>
                        {logoPreview ? (
                          <div className="flex items-center gap-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logoPreview} alt="Logo preview" className="border-border h-16 w-16 rounded-full border object-cover" />
                            <button
                              type="button"
                              onClick={() => setLogoPreview(null)}
                              className="text-destructive text-[11px] font-[var(--font-data)] tracking-wide hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 transition-colors">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                              <Plus className="h-5 w-5" />
                            </div>
                            <span className="text-muted-foreground text-[11px] font-[var(--font-data)]">Drop logo or click to upload</span>
                            <span className="text-muted-foreground/60 text-[10px]">PNG, JPG, SVG · max 2MB</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Primary Contact */}
                  <div>
                    <SectionDivider num="02" label="Primary Contact" />
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLASS}>First Name *</label>
                          <input
                            className={cn(INPUT_CLASS, errors.firstName && "border-destructive")}
                            placeholder="Jane"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            onBlur={() => validate()}
                          />
                          {errors.firstName && <p className="text-destructive mt-1 text-[11px]">{errors.firstName}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Last Name *</label>
                          <input
                            className={cn(INPUT_CLASS, errors.lastName && "border-destructive")}
                            placeholder="Smith"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onBlur={() => validate()}
                          />
                          {errors.lastName && <p className="text-destructive mt-1 text-[11px]">{errors.lastName}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLASS}>Email *</label>
                          <input
                            type="email"
                            className={cn(INPUT_CLASS, errors.email && "border-destructive")}
                            placeholder="jane@acme.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => validate()}
                          />
                          {errors.email && <p className="text-destructive mt-1 text-[11px]">{errors.email}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Phone</label>
                          <input
                            type="tel"
                            className={INPUT_CLASS}
                            placeholder="+1 (555) 000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Role / Title</label>
                        <input
                          className={INPUT_CLASS}
                          placeholder="e.g., CEO, Project Manager, Procurement"
                          value={contactRole}
                          onChange={(e) => setContactRole(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Additional Contacts */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setContactsOpen((v) => !v)}
                      className="text-muted-foreground hover:text-foreground flex w-full items-center gap-3 text-[11px] font-[var(--font-data)] font-bold tracking-[0.2em] uppercase transition-colors"
                    >
                      <span className="border-muted/30 flex h-5 w-5 items-center justify-center rounded-full border text-[9px]">03</span>
                      Additional Contacts
                      <div className="bg-muted/30 h-px flex-1" />
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", contactsOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {contactsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 space-y-3">
                            {extraContacts.map((contact, i) => (
                              <div key={contact.id} className="border-border rounded-xl border p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-muted-foreground text-[10px] font-[var(--font-data)] tracking-widest uppercase">Contact {i + 2}</span>
                                  <button type="button" onClick={() => removeContact(contact.id)} className="text-destructive hover:opacity-80">
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <input className={INPUT_CLASS} placeholder="First name" value={contact.firstName} onChange={(e) => setExtraContacts(prev => prev.map(c => c.id === contact.id ? { ...c, firstName: e.target.value } : c))} />
                                  <input className={INPUT_CLASS} placeholder="Last name" value={contact.lastName} onChange={(e) => setExtraContacts(prev => prev.map(c => c.id === contact.id ? { ...c, lastName: e.target.value } : c))} />
                                  <input type="email" className={INPUT_CLASS} placeholder="Email" value={contact.email} onChange={(e) => setExtraContacts(prev => prev.map(c => c.id === contact.id ? { ...c, email: e.target.value } : c))} />
                                  <input className={INPUT_CLASS} placeholder="Role" value={contact.role} onChange={(e) => setExtraContacts(prev => prev.map(c => c.id === contact.id ? { ...c, role: e.target.value } : c))} />
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addContact}
                              className="text-primary hover:text-primary/80 flex items-center gap-2 text-[11px] font-[var(--font-data)] tracking-wide transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Another Contact
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section 4: Settings */}
                  <div>
                    <SectionDivider num="04" label="Settings" />
                    <div className="space-y-4">
                      {/* Status */}
                      <div>
                        <label className={LABEL_CLASS}>Status</label>
                        <div className="flex gap-2">
                          {(["active", "pending"] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(s)}
                              className={cn(
                                "flex-1 rounded-xl border px-4 py-2.5 text-[11px] font-semibold tracking-[0.15em] uppercase transition-all duration-150 font-[var(--font-data)]",
                                status === s
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
                              )}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL_CLASS}>Currency</label>
                          <div className="relative">
                            <select className={SELECT_CLASS} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="text-muted-foreground/60 pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                          </div>
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Payment Terms</label>
                          <div className="relative">
                            <select className={SELECT_CLASS} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                              {PAYMENT_TERMS.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                            </select>
                            <ChevronDown className="text-muted-foreground/60 pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className={LABEL_CLASS}>Tags</label>
                        <div className={cn(INPUT_CLASS, "flex min-h-[44px] flex-wrap gap-1.5 p-2")}>
                          {tags.map((tag) => (
                            <span key={tag} className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]">
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary/80">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                          <input
                            className="text-foreground placeholder:text-muted-foreground/60 min-w-[100px] flex-1 bg-transparent text-[13px] outline-none"
                            placeholder={tags.length === 0 ? "Type + Enter to add tags" : "Add more..."}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className={LABEL_CLASS}>Internal Notes</label>
                        <textarea
                          rows={3}
                          className={cn(INPUT_CLASS, "resize-none")}
                          placeholder="Internal notes about this client..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        <p className="text-muted-foreground/60 mt-1 text-[10px] font-[var(--font-data)]">Only visible to your team</p>
                      </div>

                      {/* Send invite toggle */}
                      <div className="border-border bg-muted/10 flex items-center justify-between rounded-xl border px-4 py-3">
                        <div>
                          <p className="text-foreground text-[13px] font-medium">Send email invitation</p>
                          <p className="text-muted-foreground text-[11px] font-[var(--font-data)]">Client receives a portal invite link</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSendInvite((v) => !v)}
                          className={cn(
                            "relative h-6 w-11 rounded-full transition-colors duration-200",
                            sendInvite ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                              sendInvite && "translate-x-5",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground rounded-xl border px-5 py-2.5 text-[12px] font-[var(--font-data)] font-semibold tracking-[0.15em] uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/80 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[12px] font-[var(--font-data)] font-bold tracking-[0.15em] text-white uppercase transition-all disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {submitting ? "Saving..." : "Save Client →"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
