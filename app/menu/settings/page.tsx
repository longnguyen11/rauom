import { MenuSettingsForm } from "@/components/menu-settings-form";
import { MenuSettingsLogin } from "@/components/menu-settings-login";
import { isMenuSettingsAuthorizedForPage } from "@/lib/menu-settings-auth";
import { listTemporaryMenuDishes } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function MenuSettingsPage() {
  const authorized = await isMenuSettingsAuthorizedForPage();

  if (!authorized) {
    return (
      <main className="menu-settings-page">
        <MenuSettingsLogin />
      </main>
    );
  }

  const temporaryDishes = await listTemporaryMenuDishes();

  return (
    <main className="menu-settings-page">
      <MenuSettingsForm initialDishes={temporaryDishes} />
    </main>
  );
}
