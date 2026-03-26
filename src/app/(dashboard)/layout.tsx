import { getInitialData } from "@/app/actions/get-initial-data";
import DashboardShell from "./DashboardShell";

/**
 * Server component layout for the dashboard route group.
 * Fetches initial data from the DB and passes it to the client shell
 * for Zustand store hydration.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialData = await getInitialData();

  return (
    <DashboardShell initialData={initialData}>
      {children}
    </DashboardShell>
  );
}
