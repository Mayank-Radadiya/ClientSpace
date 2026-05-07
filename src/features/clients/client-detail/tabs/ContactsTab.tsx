"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ClientAvatar } from "../../components/ClientAvatar";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
};

type ContactsTabProps = {
  clientId: string;
  contactName: string | null;
  email: string;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[13px] font-[var(--font-data)] text-foreground placeholder-muted-foreground outline-none focus:border-[#4F7FFF]";

export function ContactsTab({ contactName, email }: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const parts = (contactName ?? "").split(" ");
    return [
      {
        id: "primary",
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" ") ?? "",
        email,
        phone: "",
        role: "Primary Contact",
        isPrimary: true,
      },
    ];
  });
  const [adding, setAdding] = useState(false);
  const [newContact, setNewContact] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "" });

  function addContact() {
    if (!newContact.firstName || !newContact.email) return;
    setContacts((prev) => [...prev, { ...newContact, id: Math.random().toString(36).slice(2), isPrimary: false }]);
    setNewContact({ firstName: "", lastName: "", email: "", phone: "", role: "" });
    setAdding(false);
  }

  function removeContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      {contacts.map((c) => (
        <div key={c.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
          <ClientAvatar companyName={`${c.firstName} ${c.lastName}`} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[14px] font-semibold text-foreground font-[var(--font-display)]">
                {c.firstName} {c.lastName}
              </p>
              {c.isPrimary && (
                <span className="rounded-full border border-[rgba(79,127,255,0.3)] px-2 py-0.5 text-[9px] font-bold tracking-[0.15em] uppercase text-[#4F7FFF] font-[var(--font-data)]">
                  Primary
                </span>
              )}
            </div>
            {c.role && <p className="text-[11px] text-muted-foreground font-[var(--font-data)]">{c.role}</p>}
            <p className="text-[12px] text-foreground font-[var(--font-data)] mt-1">{c.email}</p>
            {c.phone && <p className="text-[12px] text-muted-foreground font-[var(--font-data)]">{c.phone}</p>}
          </div>
          {!c.isPrimary && (
            <button onClick={() => removeContact(c.id)} className="text-muted-foreground hover:text-[#EF4444] transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-2xl border border-[rgba(79,127,255,0.2)] bg-card p-5 space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4F7FFF] font-[var(--font-data)]">New Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <input className={INPUT_CLASS} placeholder="First name *" value={newContact.firstName} onChange={(e) => setNewContact(p => ({ ...p, firstName: e.target.value }))} />
            <input className={INPUT_CLASS} placeholder="Last name" value={newContact.lastName} onChange={(e) => setNewContact(p => ({ ...p, lastName: e.target.value }))} />
            <input type="email" className={INPUT_CLASS} placeholder="Email *" value={newContact.email} onChange={(e) => setNewContact(p => ({ ...p, email: e.target.value }))} />
            <input className={INPUT_CLASS} placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact(p => ({ ...p, phone: e.target.value }))} />
            <input className={`${INPUT_CLASS} col-span-2`} placeholder="Role / Title" value={newContact.role} onChange={(e) => setNewContact(p => ({ ...p, role: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={addContact} className="rounded-xl bg-[#4F7FFF] px-4 py-2 text-[11px] font-bold tracking-[0.15em] uppercase text-white hover:bg-[#6B95FF] transition-colors font-[var(--font-data)]">
              Add Contact
            </button>
            <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-4 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors font-[var(--font-data)]">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgba(79,127,255,0.3)] py-4 text-[12px] font-semibold text-[#4F7FFF] hover:border-[#4F7FFF] hover:bg-[rgba(79,127,255,0.04)] transition-all font-[var(--font-data)]"
        >
          <Plus className="h-4 w-4" /> Add Contact
        </button>
      )}

      <p className="text-center text-[10px] text-muted-foreground font-[var(--font-data)]">
        Contacts are stored locally — persistence coming in a future update
      </p>
    </div>
  );
}
