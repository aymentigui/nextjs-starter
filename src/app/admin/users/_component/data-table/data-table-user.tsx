"use client";

import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
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
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/use-session";
import Loading from "@/components/myui/loading";

import { Columns } from "./columns-table";
import { columns } from "./columns-table";
import SearchTable from "@/components/myui/table/search-table";
import TablePagination from "@/components/myui/table/table-pagination";

interface DataTableProps {
    data: Columns[];
    selectedIds?: string[];
    setSelectedIds: (ids: string[]) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    debouncedSearchQuery?: string;
    setDebouncedSearchQuery: (query: string) => void;
    page?: number;
    setPage?: (page: any) => void;
    pageSize: number;
    count: number;
    showPagination?: boolean;
    showSearch?: boolean;
}

export function DataTable({
    data,
    selectedIds,
    setSelectedIds,
    isLoading,
    debouncedSearchQuery,
    setDebouncedSearchQuery,
    page,
    setPage,
    pageSize,
    count,
    showPagination = false,
    showSearch = false
}: DataTableProps) {

    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [selectedData, setSelectedData] = useState<string[]>([]);
    const { session } = useSession()

    //-------------------------------------------------------------
    // modifier 
    // --------------------------------------------------------------
    const hasPermissionAction = (session?.user?.permissions.find((permission: string) => permission === "users_update" || permission === "users_delete") ?? false) ||
        session?.user?.is_admin;

    const s = useTranslations('System')
    useEffect(() => {
        setSelectedLanguage(Cookies.get('lang') || 'en')
    }, [])


    //-------------------------------------------------------------
    // don't touch it
    //-------------------------------------------------------------
    const table = useReactTable({
        data: data,
        columns, // Utilisez les colonnes importées
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            rowSelection: selectedIds
                ? selectedIds.reduce((acc, id) => {
                    const index = data.findIndex((element) => element.id === id);
                    if (index === -1) {
                        return acc;
                    }
                    acc[index] = true;
                    return acc;
                }, {} as Record<string, boolean>)
                : selectedData.reduce((acc, id) => {
                    acc[id] = true;
                    return acc;
                }, {} as Record<string, boolean>),
        },
        onRowSelectionChange: (updaterOrValue) => {
            const newRowSelection =
                typeof updaterOrValue === "function"
                    ? updaterOrValue(table.getState().rowSelection)
                    : updaterOrValue;
            const selectedIndexes = Object.keys(newRowSelection).filter(
                (name) => newRowSelection[name]
            );
            const selectedIds2 = selectedIndexes.map((id) => table.getRowModel().rows.find((row) => row.id === id)?.original.id || '')
            setSelectedIds(selectedIds2)
            setSelectedData(selectedIndexes);
        },
    });
    //-------------------------------------------------------------
    //-------------------------------------------------------------


    return (
        <div>
            {showSearch && <SearchTable setPage={setPage} page={page} debouncedSearchQuery={debouncedSearchQuery} setDebouncedSearchQuery={setDebouncedSearchQuery} />}
            {
                isLoading
                    ?
                    (<div className="h-[300px] flex items-center justify-center">
                        <Loading />
                    </div>)
                    :
                    <>
                        <div>
                            <div className="flex px-4 mb-2 border rounded-md p-2">
                                <h2 className="text-xs font-semibold">
                                    {s("total") + " : " + count}
                                </h2>
                            </div>
                        </div>
                        <div className="rounded-md border p-2">
                            <Table className="border">
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                (header.id !== "actions" || hasPermissionAction)
                                                    ? <TableHead key={header.id}
                                                        className={`
                                                        ${selectedLanguage == "ar" ? "text-right " : ""} 
                                                        ${header.id === "actions" ? "w-[130px]" : ""} 
                                                        ${header.id === "description" ? "w-1/3" : ""} 
                                                    `}>
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    </TableHead>
                                                    : null
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
                    </>
            }
            {/* Pagination */}
            {!isLoading && showPagination &&
                <TablePagination page={page} setPage={setPage} count={count} pageSize={pageSize} isLoading={isLoading} debouncedSearchQuery={debouncedSearchQuery} />
            }
        </div>
    );
}