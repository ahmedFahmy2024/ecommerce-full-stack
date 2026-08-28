export interface RolePermission {
  id: string;
  permissionType: string;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string | { ar: string; en: string };
  guardName: string;
  permissions: RolePermission[];
}

export interface Permission {
  id: string;
  displayName: string;
  guardName: string;
  permissionType: string;
}
