"use client";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { columns } from "./columns-permission"; // Importez les colonnes
import { Permission } from "./columns-permission";
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useTranslations } from "next-intl";

interface DataTableProps {
    permissions: Permission[];
    selectedPermissions: string[];
    selectedPermissionNames?: string[];
    setSelectedPermissions: (permissions: string[]) => void;
    setSelectedPermissionsName: (permissions: string[]) => void;
}

export function DataTable({
    permissions,
    selectedPermissions,
    selectedPermissionNames,
    setSelectedPermissions,
    setSelectedPermissionsName
}: DataTableProps) {

    const [selectedLanguage, setSelectedLanguage] = useState("");
    const s = useTranslations('System')
    useEffect(() => {
        setSelectedLanguage(Cookies.get('lang') || 'en')
    }, [])

    const table = useReactTable({
        data: permissions,
        columns, // Utilisez les colonnes importées
        getCoreRowModel: getCoreRowModel(),
        state: {
            rowSelection: selectedPermissionNames
                ? selectedPermissionNames.reduce((acc, name) => {
                    const index = permissions.findIndex((permission) => permission.name === name);
                    if (index === -1) {
                        return acc;
                    }
                    acc[index] = true;
                    return acc;
                }, {} as Record<string, boolean>)
                : selectedPermissions.reduce((acc, id) => {
                    acc[id] = true;
                    return acc;
                }, {} as Record<string, boolean>),
        },
        onRowSelectionChange: (updaterOrValue) => {
            const newRowSelection =
                typeof updaterOrValue === "function"
                    ? updaterOrValue(table.getState().rowSelection)
                    : updaterOrValue;
            const selectedIds = Object.keys(newRowSelection).filter(
                (name) => newRowSelection[name]
            );
            const selectedNames = selectedIds.map((id) => table.getRowModel().rows.find((row) => row.id === id)?.original.name || '')
            setSelectedPermissionsName(selectedNames)
            setSelectedPermissions(selectedIds);
        },
    });

    return (
        <div className="rounded-md border p-2">
            <Table className="border">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}
                                    className={`
                                        ${selectedLanguage == "ar" ? "text-right" : ""}
                                        `}>
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
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
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
                    )}
                </TableBody>
            </Table>
        </div>
    );
}