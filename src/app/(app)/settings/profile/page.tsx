import { ProfileScreen } from "@/features/profile/components/profile-screen";
import { requireSession } from "@/lib/auth";

export const instant = false;

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await requireSession({ allowMustChangePassword: true });
  return (
    <ProfileScreen
      name={session.user.name}
      email={session.user.email}
      mustChangePassword={Boolean(session.user.mustChangePassword)}
    />
  );
}
