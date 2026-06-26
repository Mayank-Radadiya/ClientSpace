"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  User,
  ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gooeyToast } from "goey-toast";

import { PageLayout } from "@/app/(dashboard)/_components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

// ─── Zod Form Schema ──────────────────────────────────────────────────────────

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(150),
  phone: z.string().max(30).optional().or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
  category: z.enum(["lead", "vendor", "partner", "other"]),
  clientId: z.string().optional().or(z.literal("")),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// ─── Constants & Category Configs ─────────────────────────────────────────────

const CATEGORIES = [
  { key: "all", label: "All Contacts" },
  { key: "lead", label: "Leads", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { key: "vendor", label: "Vendors", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  { key: "partner", label: "Partners", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  { key: "other", label: "Others", color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" },
] as const;

function getCategoryStyles(category: string) {
  const match = CATEGORIES.find(c => c.key === category);
  return match && "color" in match ? match.color : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
}

function getAvatarGradient(name: string) {
  const colors = [
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-blue-500 to-sky-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index]!;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface LinkedClient {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  category: "lead" | "vendor" | "partner" | "other";
  clientId: string | null;
  createdAt: string | Date;
  client?: LinkedClient | null;
}

interface ContactsPageClientProps {
  clients: LinkedClient[];
  initialContacts: Contact[];
}

export function ContactsPageClient({
  clients,
  initialContacts,
}: ContactsPageClientProps) {
  const utils = trpc.useUtils();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "company" | "category" | "date">("name");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // tRPC Operations
  const { data: contactsList } = trpc.contacts.getAll.useQuery(undefined, {
    initialData: initialContacts as any,
  });

  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      gooeyToast.success("Contact created successfully!");
      utils.contacts.getAll.invalidate();
      setIsDialogOpen(false);
    },
    onError: (err) => {
      gooeyToast.error(err.message || "Failed to create contact.");
    }
  });

  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      gooeyToast.success("Contact updated successfully!");
      utils.contacts.getAll.invalidate();
      setIsDialogOpen(false);
    },
    onError: (err) => {
      gooeyToast.error(err.message || "Failed to update contact.");
    }
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      gooeyToast.success("Contact deleted successfully!");
      utils.contacts.getAll.invalidate();
    },
    onError: (err) => {
      gooeyToast.error(err.message || "Failed to delete contact.");
    }
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      category: "other",
      clientId: "",
    }
  });

  // Handle open dialog (create mode / edit mode)
  const openCreateModal = () => {
    setEditingContact(null);
    reset({
      name: "",
      email: "",
      phone: "",
      company: "",
      category: "other",
      clientId: "",
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      company: contact.company || "",
      category: contact.category,
      clientId: contact.clientId || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const onSubmitForm = (values: ContactFormValues) => {
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      company: values.company || null,
      category: values.category,
      clientId: values.clientId || null,
    };

    if (editingContact) {
      updateMutation.mutate({
        id: editingContact.id,
        ...payload
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filter & Sort Contacts
  const processedContacts = useMemo(() => {
    let list = [...(contactsList || [])];

    // Filter by category
    if (selectedCategory !== "all") {
      list = list.filter(c => c.category === selectedCategory);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) || 
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "company") {
        return (a.company || "").localeCompare(b.company || "");
      }
      if (sortBy === "category") {
        return a.category.localeCompare(b.category);
      }
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [contactsList, search, selectedCategory, sortBy]);

  return (
    <PageLayout bleed>
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--inv-divider)] pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--inv-text-primary)]">
            Contact Book
          </h1>
          <p className="font-sans text-sm text-[var(--inv-text-muted)] mt-1">
            Manage organization leads, vendors, partners, and linked clients in a unified system.
          </p>
        </div>
        <div>
          <Button
            onClick={openCreateModal}
            className="group from-primary shadow-primary/25 hover:shadow-primary/40 relative overflow-hidden rounded-xl bg-linear-to-br to-indigo-600 px-6 font-bold tracking-wide text-white shadow-lg transition-[transform,shadow] duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <Plus className="h-4 w-4 mr-2 text-white" />
            <span className="relative z-10 text-white">Add Contact</span>
          </Button>
        </div>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--inv-modal-section)] p-4 rounded-2xl border border-[var(--inv-divider)]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--inv-text-muted)]" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="inv-input-focus pl-10 h-10 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
          />
        </div>

        {/* View mode toggle, Sort & Filters */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Sort Selection */}
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="inv-input-focus font-dm-mono h-10 w-[140px] rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-xs text-[var(--inv-text-primary)]">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3 w-3" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent className="font-dm-mono border-[var(--inv-divider)] bg-[var(--inv-modal-section)] text-xs shadow-xl">
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="company">Sort by Company</SelectItem>
              <SelectItem value="category">Sort by Category</SelectItem>
              <SelectItem value="date">Sort by Newest</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle buttons */}
          <div className="flex items-center rounded-lg border border-[var(--inv-divider)] bg-[var(--inv-input-bg)] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid" 
                  ? "bg-[var(--inv-accent-primary)] text-white shadow-sm" 
                  : "text-[var(--inv-text-muted)] hover:text-[var(--inv-text-primary)]"
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list" 
                  ? "bg-[var(--inv-accent-primary)] text-white shadow-sm" 
                  : "text-[var(--inv-text-muted)] hover:text-[var(--inv-text-primary)]"
              )}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS BAR */}
      <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar border-b border-[var(--inv-divider)]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={cn(
              "px-4 py-2 text-xs font-semibold tracking-wide uppercase rounded-full border transition-all duration-200 shrink-0",
              selectedCategory === cat.key
                ? "bg-[var(--inv-accent-primary)] text-white border-[var(--inv-accent-primary)] shadow-md"
                : "border-[var(--inv-divider)] bg-[var(--inv-surface)] text-[var(--inv-text-muted)] hover:border-[var(--inv-text-primary)] hover:text-[var(--inv-text-primary)]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* CONTACTS DISPLAY AREA */}
      <AnimatePresence mode="wait">
        {processedContacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] p-12 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--inv-surface-elevated)] border border-[var(--inv-divider)]">
              <User className="h-6 w-6 text-[var(--inv-text-muted)]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--inv-text-primary)]">
              No contacts found
            </h3>
            <p className="font-sans text-xs text-[var(--inv-text-muted)] max-w-sm mt-2">
              We couldn't find any contacts matching your selection. Try adding one or adjusting your filters.
            </p>
            <Button
              onClick={openCreateModal}
              className="mt-6 h-9 rounded-full bg-[var(--inv-accent-primary)] px-5 text-xs font-medium text-white transition-all hover:bg-[var(--inv-accent-hover)]"
            >
              Add first contact
            </Button>
          </motion.div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {processedContacts.map((contact) => {
              const initials = contact.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              const categoryStyles = getCategoryStyles(contact.category);
              const avatarGradient = getAvatarGradient(contact.name);

              return (
                <motion.div
                  key={contact.id}
                  layout
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--inv-accent-primary)]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white shadow-md",
                        avatarGradient
                      )}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display truncate text-sm font-bold text-[var(--inv-text-primary)]">
                          {contact.name}
                        </h4>
                        {contact.company ? (
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[var(--inv-text-muted)] font-medium">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{contact.company}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Action dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--inv-text-muted)] hover:bg-[var(--inv-surface-elevated)] hover:text-[var(--inv-text-primary)]">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[140px] border-[var(--inv-divider)] bg-[var(--inv-surface)] shadow-lg">
                        <DropdownMenuItem
                          onClick={() => openEditModal(contact)}
                          className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-(--inv-accent-primary) text-xs"
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[var(--inv-divider)]" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(contact.id, contact.name)}
                          className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-600 text-xs"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      categoryStyles
                    )}>
                      {contact.category}
                    </span>
                    {contact.client ? (
                      <div className="inline-flex items-center gap-1 rounded-full border border-[var(--inv-divider)] bg-[var(--inv-input-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--inv-text-muted)]">
                        <LinkIcon className="h-2.5 w-2.5 shrink-0" />
                        <span className="max-w-[120px] truncate">
                          {contact.client.companyName || contact.client.contactName}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Contact Details */}
                  <div className="mt-5 space-y-2 border-t border-[var(--inv-divider)] pt-4 text-xs font-medium text-[var(--inv-text-muted)]">
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 transition-colors hover:text-[var(--inv-accent-primary)]"
                    >
                      <Mail className="h-3.5 w-3.5 text-[var(--inv-text-muted)] group-hover:text-[var(--inv-accent-primary)]/70" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 transition-colors hover:text-[var(--inv-accent-primary)]"
                      >
                        <Phone className="h-3.5 w-3.5 text-[var(--inv-text-muted)]" />
                        <span>{contact.phone}</span>
                      </a>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* LIST VIEW */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--inv-divider)] bg-[var(--inv-surface-elevated)] font-dm-mono text-[10px] tracking-wider text-[var(--inv-text-muted)] uppercase">
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Company</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Phone</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Linked Client</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--inv-divider)] text-xs text-[var(--inv-text-primary)]">
                  {processedContacts.map((contact) => {
                    const initials = contact.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                    const categoryStyles = getCategoryStyles(contact.category);
                    const avatarGradient = getAvatarGradient(contact.name);

                    return (
                      <tr
                        key={contact.id}
                        className="transition-colors hover:bg-[var(--inv-accent-subtle)]"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white shadow-sm",
                              avatarGradient
                            )}>
                              {initials}
                            </div>
                            <span className="font-display font-semibold">
                              {contact.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-[var(--inv-text-muted)] font-medium">
                          {contact.company || "—"}
                        </td>
                        <td className="px-6 py-3.5 font-medium">
                          <a
                            href={`mailto:${contact.email}`}
                            className="hover:text-[var(--inv-accent-primary)]"
                          >
                            {contact.email}
                          </a>
                        </td>
                        <td className="px-6 py-3.5 text-[var(--inv-text-muted)] font-medium">
                          {contact.phone || "—"}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            categoryStyles
                          )}>
                            {contact.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {contact.client ? (
                            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--inv-text-muted)]">
                              <LinkIcon className="h-3 w-3 text-[var(--inv-text-muted)]" />
                              <span>{contact.client.companyName || contact.client.contactName}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--inv-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-[var(--inv-text-muted)] hover:text-(--inv-accent-primary)"
                              onClick={() => openEditModal(contact)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                              onClick={() => handleDelete(contact.id, contact.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE & EDIT MODAL DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogPortal>
          {/* Backdrop */}
          <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,15,25,0.60)] p-4 backdrop-blur-[8px] duration-200">
            {/* Modal Body */}
            <DialogContent className="relative w-full max-w-[480px] rounded-2xl border border-[var(--inv-input-border)] bg-[var(--inv-modal-bg)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[var(--inv-divider)] pb-4 mb-5">
                <h3 className="font-display text-lg font-bold text-[var(--inv-text-primary)]">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-[var(--inv-text-muted)] hover:bg-[var(--inv-surface-elevated)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-[var(--inv-text-muted)]">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="E.g. Sarah Jenkins"
                    className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-[var(--inv-text-muted)]">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah@example.com"
                    className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone & Company */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-[var(--inv-text-muted)]">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 019-2834"
                      className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-xs font-semibold text-[var(--inv-text-muted)]">
                      Company
                    </Label>
                    <Input
                      id="company"
                      placeholder="Acme Corp"
                      className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]"
                      {...register("company")}
                    />
                    {errors.company && (
                      <p className="text-xs text-red-500 font-medium">{errors.company.message}</p>
                    )}
                  </div>
                </div>

                {/* Category & Client Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-semibold text-[var(--inv-text-muted)]">
                      Category *
                    </Label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className="border-[var(--inv-divider)] bg-[var(--inv-modal-section)] text-sm shadow-xl">
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="clientId" className="text-xs font-semibold text-[var(--inv-text-muted)]">
                      Link Client Account
                    </Label>
                    <Controller
                      control={control}
                      name="clientId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || "_none"}>
                          <SelectTrigger className="inv-input-focus h-11 rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-sm text-[var(--inv-text-primary)]">
                            <SelectValue placeholder="Link Client" />
                          </SelectTrigger>
                          <SelectContent className="border-[var(--inv-divider)] bg-[var(--inv-modal-section)] text-sm shadow-xl max-h-[200px] overflow-y-auto">
                            <SelectItem value="_none">None</SelectItem>
                            {clients.map((c) => {
                              const label = c.companyName || c.contactName || c.email;
                              return (
                                <SelectItem key={c.id} value={c.id}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 border-t border-[var(--inv-divider)] pt-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-10 rounded-xl px-5 text-sm font-medium border-[var(--inv-input-border)] text-[var(--inv-text-muted)] hover:bg-[var(--inv-surface-elevated)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="h-10 rounded-xl px-6 text-sm font-bold bg-[var(--inv-accent-primary)] text-white hover:bg-[var(--inv-accent-hover)]"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Contact"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </div>
        </DialogPortal>
      </Dialog>
    </PageLayout>
  );
}
