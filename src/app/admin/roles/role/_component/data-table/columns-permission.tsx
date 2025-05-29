"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";

export type Permission = {
  name: string; // Supprimez l'`id`
};

const headerColumn = ( )=>{
  const p=useTranslations("Permissions")
  return p("title")
}

const cellColumn = ( value: string )=>{
  const p=useTranslations("Permissions")
  return p(value)
}


export const columns: ColumnDef<Permission>[] = [
  {
    accessorKey: "name",
    header: headerColumn,
    cell: (info) => cellColumn(info.getValue() as string),
  },
  {
    id: "actions",
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
];