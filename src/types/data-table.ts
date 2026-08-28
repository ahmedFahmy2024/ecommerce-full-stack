import type { ColumnSort, Row, RowData } from "@tanstack/react-table";
import type { DataTableConfig } from "@/config/data-table";
import type { FilterItemSchema } from "@/lib/parsers";

declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: TData is used in the TableMeta interface
  interface TableMeta<TData extends RowData> {
    queryKeys?: QueryKeys;
    onFilterMenuOpen?: () => void;
  }

  // biome-ignore lint/correctness/noUnusedVariables: TData and TValue are used in the ColumnMeta interface
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    isLoading?: boolean;
    onOpen?: () => void;
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
    /** Override the URL param key when buildTableQuery maps this filter to an API param. */
    apiKey?: string;
  }
}

export interface QueryKeys {
  page: string;
  perPage: string;
  sort: string;
  filters: string;
  joinOperator: string;
}

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export type ActionMode = "page" | "drawer";

export interface DataTableRowAction<TData> {
  row: Row<TData> | null;
  variant: "create" | "update" | "delete" | "view";
}

export interface TableActionsConfig {
  create?: boolean;
  /** How the create action opens. Defaults to "page". */
  createMode?: ActionMode;
  edit?: boolean;
  /** How the edit action opens. Defaults to "page". */
  editMode?: ActionMode;
  delete?: boolean;
  view?: boolean;
  /** How the view action opens. Defaults to "page". */
  viewMode?: ActionMode;
}
