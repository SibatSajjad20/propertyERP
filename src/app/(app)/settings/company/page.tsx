import { redirect } from "next/navigation";
import { CompanySettingsScreen } from "@/features/settings/components/company-settings-screen";
import { getCompanySettingsPage } from "@/features/settings/queries";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Company",
};

export default async function CompanySettingsPage() {
  const session = await requireSession();
  if (!can(session.user.role, "settings.manage")) {
    redirect("/inventory");
  }
  const { settings, signatories } = await getCompanySettingsPage();
  return <CompanySettingsScreen settings={settings} signatories={signatories} />;
}
