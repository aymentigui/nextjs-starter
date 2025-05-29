"use client"
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Settings2, Trash, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import axios from "axios";
import { useOrigin } from "@/hooks/use-origin";
import { useSession } from "@/hooks/use-session";

export type Role = {
  id: string;
  name: string;
  userCount: number;
};

const nameHeader = (column: any) => {
  const r = useTranslations("Roles")
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {r("title")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const totalusersHeader = () => {
  const r = useTranslations("Roles")
  const [selectedLanguage, setSelectedLanguage] = useState("");

  useEffect(() => {
    setSelectedLanguage(Cookies.get('lang') || 'en')
  }, [])

  return (
    <div className={selectedLanguage === "ar" ? "text-right" : ""}>{r("totalusers")}</div>
  )
}

const actionsCell = (row: any) => {
  const role = row.original;
  const router = useRouter();
  const { session } = useSession()
  const hasPermissionDeleteRoles = (session?.user?.permissions.find((permission: string) => permission === "roles_delete") ?? false) || session?.user?.is_admin;
  const hasPermissionUpdateRoles = (session?.user?.permissions.find((permission: string) => permission === "roles_update") ?? false) || session?.user?.is_admin;
  
  const origin = useOrigin();

  useEffect(() => {
  }, [origin]);

  return (
    <div className="w-1/6 flex gap-2">
      {hasPermissionUpdateRoles && <Button
        onClick={() => router.push(`/admin/roles/role/${role.id}`)}
        variant="outline"
      >
        <Settings2 />
      </Button>}
      { hasPermissionDeleteRoles && origin && <Button
        onClick={() => deleteRoleHandler(role.id, origin)}
        variant="destructive"
      >
        <Trash />
      </Button>}
    </div>
  );
}

export const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => nameHeader(column),
    cell: ({ row }) => (
      <div className="w-4/6">
        {row.getValue("name")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "userCount",
    header: totalusersHeader,
    cell: ({ row }) => (
      <div className="w-1/6">
        {row.getValue("userCount")}
      </div>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => { return actionsCell(row) },
  },
];

const deleteRoleHandler = async (roleId: string, origin:string) => {
  if(!origin) return
  const response = await axios.delete(origin+"/api/admin/roles/" + roleId);
  if (response.data.status === 200) {
    toast.success(response.data.data.message);
    window.location.reload();
  } else {
    toast.error(response.data.data.message)
  }
};


