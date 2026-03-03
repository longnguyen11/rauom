import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import { isAdminAuthorizedForPage } from "@/lib/admin-auth";
import { listAllDishesForAdmin } from "@/lib/dishes";
import { listAdminOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authorized = await isAdminAuthorizedForPage();
  if (!authorized) {
    redirect("/admin/login");
  }

  let orders:
    | Awaited<ReturnType<typeof listAdminOrders>>
    | null = null;
  let dishes:
    | Awaited<ReturnType<typeof listAllDishesForAdmin>>
    | null = null;
  let setupError: string | null = null;

  try {
    [orders, dishes] = await Promise.all([
      listAdminOrders(200),
      listAllDishesForAdmin(),
    ]);
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : "Unknown admin initialization error.";
  }

  if (setupError || !orders || !dishes) {
    return (
      <section className="page-prose">
        <h1>Admin Setup Error</h1>
        <p>
          Admin loaded but data queries failed. This is usually a missing D1 migration
          or binding mismatch.
        </p>
        <p>
          Try: <code>npm run db:migrate:remote</code>, then redeploy.
        </p>
        <p>
          Technical detail: <code>{setupError ?? "Unknown admin setup error."}</code>
        </p>
      </section>
    );
  }

  return (
    <section className="page-prose" style={{ background: "transparent", border: "0", padding: 0 }}>
      <h1>Admin</h1>
      <p>
        Protect this route in production with Cloudflare Access policy and keep token
        login only as fallback.
      </p>
      <AdminDashboard initialOrders={orders} initialDishes={dishes} />
    </section>
  );
}
