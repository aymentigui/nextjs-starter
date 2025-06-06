"use client";

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
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Import du Dialog
import { useState } from "react";
import Loading from "@/components/myui/loading";

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
  const u = useTranslations("Users");
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
  const u = useTranslations("Users");
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
  const u = useTranslations("Users");
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
  const u = useTranslations("Users");
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
  const u = useTranslations("Users");
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
  const preview = row.getValue("image_compressed");
  return preview ? (
    <MyImage
      image={preview}
      alt="Avatar"
      load
      classNameProps="w-4 h-4 object-cover rounded-full"
    />
  ) : (
    <CircleUserRound className="w-4 h-4 text-gray-500" />
  );
};

const actionsCell = (row: any) => {
  const user = row.original;
  const origin = useOrigin();
  const translate= useTranslations("System");
  const { openDialog } = useAddUpdateUserDialog();
  const { session } = useSession();
  const hasPermissionDeleteUsers = (session?.user?.permissions.find((permission: string) => permission === "users_delete") ?? false) || session?.user?.is_admin;
  const hasPermissionUpdateUsers = (session?.user?.permissions.find((permission: string) => permission === "users_update") ?? false) || session?.user?.is_admin;

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Fonction pour ouvrir le dialog avec l'utilisateur à supprimer
  const handleOpenDialog = (userId: string) => {
    setUserToDelete(userId);
    setIsOpen(true); // Ouvrir le modal de confirmation
  };

  // Fonction de suppression après confirmation
  const deleteUserHandler = async () => {
    if (!userToDelete || !origin) return;
    try {
      setLoading(true)
      const response = await axios.delete(`${origin}/api/admin/users/${userToDelete}`);
      if (response.data.status === 200) {
        toast.success(response.data.data.message);
        window.location.reload();
      } else {
        toast.error(response.data.data.message);
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la suppression.");
    }
    setLoading(true)
    setIsOpen(false); // Fermer le modal après suppression
  };

  return (
    <div className="w-1/6 flex gap-2">
      {hasPermissionDeleteUsers && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" onClick={() => handleOpenDialog(user.id)}>
              <Trash />
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogTitle>{translate("confermationdelete")}</DialogTitle>
            <DialogDescription>
              {translate("confermationdeletemessage")}
            </DialogDescription>
            <DialogFooter>
              <Button disabled={loading} variant="outline" onClick={() => setIsOpen(false)}>
                {translate("cancel")}
              </Button>
              {loading
                ? <Button disabled variant="destructive">
                  <Loading classSizeProps="h-4 w-4" />
                </Button>
                : <Button disabled={loading} variant="destructive" onClick={deleteUserHandler}>
                  {translate("delete")}
                </Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {hasPermissionUpdateUsers && (
        <Button variant={"outline"} onClick={() => openDialog(false, row.original)}>
          <Settings2 />
        </Button>
      )}
    </div>
  );
};

export const columns: ColumnDef<Columns>[] = [
  {
    id: "actionsCheck",
    header: ({ table }) => {
      const allSelected = table.getIsAllRowsSelected();
      return (
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => {
            table.toggleAllRowsSelected(!!value);
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
    cell: ({ row }) => imageCell(row),
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
    cell: ({ row }) => rolesCell(row),
    enableSorting: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => actionsCell(row),
  },
];
