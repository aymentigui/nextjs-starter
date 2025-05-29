"use client"
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash, ArrowUpDown, Settings2, CircleUserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useAddUpdateUserDialog } from "@/context/add-update-dialog-context";
import { useSession } from "@/hooks/use-session";
import axios from "axios";
import { useOrigin } from "@/hooks/use-origin";
import { Checkbox } from "@/components/ui/checkbox";
import MyImage from "@/components/myui/my-image";

export type Columns = {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  image: string;
  imageCompressed: string;
  roles: string[];
  is_admin: boolean;
};

const fitstnameHeader = (column: any) => {
  const u = useTranslations("Users")
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex justify-between"
    >
      {u("firstname")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const lastnameHeader = (column: any) => {
  const u = useTranslations("Users")
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex justify-between"
    >
      {u("lastname")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const emailHeader = (column: any) => {
  const u = useTranslations("Users")
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex justify-between"
    >
      {u("email")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const usernameHeader = (column: any) => {
  const u = useTranslations("Users")
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex justify-between"
    >
      {u("username")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const rolesHeader = (column: any) => {
  const u = useTranslations("Users")
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex justify-between"
    >
      {u("roles")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const rolesCell = (row: any) => {
  const u = useTranslations("Users");
  const roles = row.getValue("roles") as string[];
  const is_admin = row.original.is_admin as boolean;

  return (
    <div className="w-4/6">
      {is_admin ? u("isadmin") : roles.join(", ") || "No roles"}
    </div>
  );
};

const imageCell = (row: any) => {
  const preview = row.getValue("image_compressed")
  return preview ? (
    <MyImage
      image={preview}
      alt="Avatar"
      load
      classNameProps="w-4 h-4 object-cover rounded-full"
    />
  ) : (
    <CircleUserRound className="w-4 h-4 text-gray-500" />
  )
}

const actionsCell = (row: any) => {
  const user = row.original;
  const origin = useOrigin()
  const { openDialog } = useAddUpdateUserDialog();
  const { session } = useSession()
  const hasPermissionDeleteUsers = (session?.user?.permissions.find((permission: string) => permission === "users_delete") ?? false) || session?.user?.is_admin;
  const hasPermissionUpdateUsers = (session?.user?.permissions.find((permission: string) => permission === "users_update") ?? false) || session?.user?.is_admin;

  const handleOpenDialogWithTitle = () => {
    openDialog(false, row.original)
  };

  return (
    <div className="w-1/6 flex gap-2">
      {hasPermissionDeleteUsers && <Button
        onClick={() => deleteUserHandler(user.id, origin ?? "")}
        variant="destructive"
      >
        <Trash />
      </Button>}
      {hasPermissionUpdateUsers && <Button variant={"outline"} onClick={handleOpenDialogWithTitle}>
        <Settings2 />
      </Button>}
    </div>
  );
};

export const columns: ColumnDef<Columns>[] = [
  {
    id: "actionsCheck",
    header: ({ table }) => {
      const allSelected = table.getIsAllRowsSelected(); // Vérifie si toutes les lignes sont sélectionnées

      return (
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => {
            table.toggleAllRowsSelected(!!value); // Sélectionne ou désélectionne toutes les lignes
          }}
        />
      );
    },
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      );
    },
  },
  {
    accessorKey: "image_compressed",
    header: "image",
    cell: ({ row }) => (imageCell(row)),
    enableSorting: true,
  },
  {
    accessorKey: "firstname",
    header: ({ column }) => fitstnameHeader(column),
    cell: ({ row }) => (
      <div className="w-4/6">
        {row.getValue("firstname")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "lastname",
    header: ({ column }) => lastnameHeader(column),
    cell: ({ row }) => (
      <div className="w-4/6">
        {row.getValue("lastname")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => emailHeader(column),
    cell: ({ row }) => (
      <div className="w-4/6">
        {row.getValue("email")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "username",
    header: ({ column }) => usernameHeader(column),
    cell: ({ row }) => (
      <div className="w-4/6">
        {row.getValue("username")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "roles",
    header: ({ column }) => rolesHeader(column),
    cell: ({ row }) => (
      rolesCell(row)
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return actionsCell(row);
    },
  },
];

const deleteUserHandler = async (userId: string, origin: string) => {
  if (!origin) return
  const response = await axios.delete(origin + "/api/admin/users/" + userId);
  if (response.data.status === 200) {
    toast.success(response.data.data.message);
    window.location.reload()
  } else {
    toast.error(response.data.data.message)
  }
};


