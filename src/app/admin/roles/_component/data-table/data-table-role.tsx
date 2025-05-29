"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useSession } from "@/hooks/use-session";
import { useOrigin } from "@/hooks/use-origin";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "@/components/myui/loading";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
}

export function DataTable<TData, TValue>({
  columns,
}: DataTableProps<TData, TValue>) {

  const [data, setData] = useState<TData[]>([])

  const origin = useOrigin()
  const [mounted, setMounted] = useState(false)
  
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const { session } = useSession()

  const r = useTranslations('Roles')
  const s = useTranslations('System')

  // fetch
  useEffect(() => {
    if (!origin) return
    setSelectedLanguage(Cookies.get('lang') || 'en')
    const roles = axios(origin + "/api/admin/roles")
    roles.then((res) => {
      setData(res.data)
      setMounted(true)
    })
      .catch((e) => toast.error(e.message))
  }, [origin])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const hasPermissionAction=(session?.user?.permissions.find((permission: string) => permission === "roles_update" || permission === "roles_delete") ?? false) ||  session?.user?.is_admin;


  return (
    <div>
      <Input
        placeholder={r("searchroles")}
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm mb-4"
      />
      <div className="rounded-md border p-2">
        <Table className="border">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  (header.id !== "actions" || (hasPermissionAction)) && <TableHead
                    key={header.id}
                    className={`
                    ${selectedLanguage == "ar" ? "text-right" : ""}
                    ${header.id === "name" ? "w-3/6" : ""}
                    ${header.id === "userCount" ? "w-2/6" : ""}
                    ${header.id === "actions" ? "w-1/6" : ""}
                  `}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {mounted
              ? table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      (cell.column.id !== "actions" || (hasPermissionAction)) && <TableCell
                        key={cell.id}
                        className={`
                      ${cell.column.id === "name" ? "w-4/6" : ""}
                      ${cell.column.id === "userCount" ? "w-1/6" : ""}
                      ${cell.column.id === "actions" ? "w-1/6" : ""}
                    `}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {s("noresults")}
                  </TableCell>
                </TableRow>
              )
              : <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loading />
                  </div>
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </div>
    </div>
  );
}