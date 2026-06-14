export const MOCK_PROJECTS = [
  {
    id: "proj-1",
    name: "Acme Brand Refresh",
    client: "Sarah Chen",
    status: "In Progress",
    budget: "$12,500",
    progress: 65,
    dueDate: "Oct 24, 2026",
  },
  {
    id: "proj-2",
    name: "Vercel Web App UI",
    client: "David Kim",
    status: "Review",
    budget: "$8,200",
    progress: 90,
    dueDate: "Oct 15, 2026",
  },
  {
    id: "proj-3",
    name: "Stripe Marketing Site",
    client: "Elena Rodriguez",
    status: "Completed",
    budget: "$24,000",
    progress: 100,
    dueDate: "Sep 30, 2026",
  },
];

export const MOCK_INVOICES = [
  {
    id: "inv-1042",
    client: "Acme Corp",
    project: "Brand Refresh",
    amount: "$4,200.00",
    status: "Paid",
    date: "Sep 01, 2026",
  },
  {
    id: "inv-1043",
    client: "Vercel Inc",
    project: "Web App UI",
    amount: "$2,800.00",
    status: "Pending",
    date: "Oct 01, 2026",
  },
  {
    id: "inv-1044",
    client: "Stripe",
    project: "Marketing Site",
    amount: "$12,000.00",
    status: "Overdue",
    date: "Oct 05, 2026",
  },
];

export const MOCK_MILESTONES = [
  {
    id: "ms-1",
    title: "Initial Wireframes",
    status: "Approved",
    date: "Sep 15",
  },
  {
    id: "ms-2",
    title: "Design System V1",
    status: "Approved",
    date: "Oct 01",
  },
  {
    id: "ms-3",
    title: "Final Delivery",
    status: "In Progress",
    date: "Oct 24",
  },
];

export const MOCK_TESTIMONIALS = [
  {
    id: "test-1",
    quote: "Our clients stopped emailing us asking for updates. That alone was worth it.",
    name: "Marcus Thorne",
    role: "Founder, Studio Thorne",
    avatar: "MT",
    featured: true,
  },
  {
    id: "test-2",
    quote: "It feels like a premium extension of our own agency. The white-labeling is incredible.",
    name: "Sofia Alvarez",
    role: "Creative Director",
    avatar: "SA",
    featured: false,
  },
  {
    id: "test-3",
    quote: "We got paid 40% faster this month because the invoices are right next to the deliverables.",
    name: "James Liu",
    role: "Independent Designer",
    avatar: "JL",
    featured: false,
  },
];
