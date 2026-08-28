"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { UserInClass } from "../types/users-in-class";

type T = ReturnType<typeof useTranslations<"Classes">>;

export function getUsersInClassColumns(t: T): ColumnDef<UserInClass>[] {
  return [
    {
      id: "search",
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("usersInClass.columns.fullName")}
        />
      ),
      cell: ({ row }) => (
        <span className="block max-w-48 truncate">{row.original.fullName}</span>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: t("usersInClass.filters.search"),
        variant: "text",
        placeholder: t("usersInClass.filters.searchPlaceholder"),
      },
    },
    {
      accessorKey: "email",
      header: t("usersInClass.columns.email"),
      cell: ({ row }) => (
        <span className="block max-w-48 truncate">{row.original.email}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "phone",
      header: t("usersInClass.columns.phone"),
      cell: ({ row }) => row.original.phone,
      enableSorting: false,
    },
    {
      accessorKey: "gender",
      header: t("usersInClass.columns.gender"),
      cell: ({ row }) => (
        <Badge variant="outline">{t(`gender.${row.original.gender}`)}</Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: t("usersInClass.columns.status"),
      cell: ({ row }) => {
        const status = row.original.userClassStatus;
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      id: "quizTaken",
      header: t("usersInClass.columns.quizTaken"),
      cell: ({ row }) => {
        const { takenQuizzes, totalQuizzes } = row.original.quizStatistics;
        return `${takenQuizzes} / ${totalQuizzes}`;
      },
      enableSorting: false,
    },
    {
      id: "quizPassed",
      header: t("usersInClass.columns.quizPassed"),
      cell: ({ row }) => {
        const { passedQuizzes, totalQuizzes } = row.original.quizStatistics;
        return `${passedQuizzes} / ${totalQuizzes}`;
      },
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("usersInClass.columns.createdAt")}
        />
      ),
      cell: ({ row }) => {
        const raw = row.getValue<string>("createdAt");
        if (!raw) return null;
        return new Date(`${raw}Z`).toLocaleDateString();
      },
      enableSorting: true,
    },
  ];
}
