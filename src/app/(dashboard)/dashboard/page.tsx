import Link from "next/link";

function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1>Dashboard</h1>
      <Link
        className="bg-primary text-primary-foreground w-fit rounded-md p-2"
        href="/dashboard/projects"
      >
        Projects
      </Link>
      <Link
        className="bg-primary text-primary-foreground w-fit rounded-md p-2"
        href="/invoices"
      >
        Invoices
      </Link>
    </div>
  );
}

export default DashboardPage;
