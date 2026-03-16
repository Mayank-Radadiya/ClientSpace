import Link from "next/link";

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Link
        className="bg-primary text-primary-foreground rounded-md p-2"
        href="/dashboard/projects"
      >
        Projects
      </Link>
    </div>
  );
}

export default DashboardPage;
