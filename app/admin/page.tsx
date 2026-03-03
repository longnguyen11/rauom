import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import { isAdminAuthorizedForPage } from "@/lib/admin-auth";
import { listAllDishesForAdmin } from "@/lib/dishes";
import { listAdminOrders } from "@/lib/orders";

export default async function AdminPage() {
  const authorized = await isAdminAuthorizedForPage();
  if (!authorized) {
    redirect("/admin/login");
  }

  const [orders, dishes] = await Promise.all([
    listAdminOrders(200),
    listAllDishesForAdmin(),
  ]);

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
