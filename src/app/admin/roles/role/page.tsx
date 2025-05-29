import { accessPage, verifySession } from "@/actions/permissions";
import AddRoleForm from "@/app/admin/roles/role/_component/forms/role-form";
import { Card } from "@/components/ui/card";
import { permissions } from "@/db/permissions";
import { getTranslations } from "next-intl/server";

// Fonction pour récupérer les permissions (simulée)

export default async function AddRolePage() {
  const r = await getTranslations("Roles")

  await accessPage(['roles_update']);

  return (
    <Card className='p-4'>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{r("addrole")}</h1>
        <AddRoleForm permissions={permissions} />
      </div>
    </Card>
  );
}