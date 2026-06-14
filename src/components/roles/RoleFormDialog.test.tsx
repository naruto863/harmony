import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DeptNode, PermissionGroup, Role } from "@/types";
import { RoleFormDialog } from "./RoleFormDialog";

const permissionGroups: PermissionGroup[] = [
  {
    resource: "users",
    label: "用户管理",
    permissions: [
      { id: "users.read", resource: "users", action: "read", description: "查看用户" },
      { id: "users.update", resource: "users", action: "update", description: "编辑用户" },
    ],
  },
];

const deptTree: DeptNode[] = [
  {
    id: "dept_root",
    name: "Demo 公司",
    parentId: null,
    status: "active",
    children: [
      {
        id: "dept_product",
        name: "产品部",
        parentId: "dept_root",
        status: "active",
      },
    ],
  },
];

const customRole: Role = {
  id: "role_custom",
  name: "项目专员",
  type: "custom",
  description: "负责项目",
  permissions: ["users.read"],
  dataScopeType: "CUSTOM",
  dataScopeDeptIds: ["dept_product"],
  createdAt: "2026-05-28T00:00:00Z",
  updatedAt: "2026-05-28T00:00:00Z",
};

describe("RoleFormDialog", () => {
  it("submits selected permissions with the default ALL data scope", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <RoleFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        permissionGroups={permissionGroups}
        deptTree={deptTree}
      />
    );

    await userEvent.type(screen.getByLabelText("角色名称 *"), "运营角色");
    await userEvent.type(screen.getByLabelText("描述"), "负责运营后台");
    await userEvent.click(screen.getByLabelText("查看用户"));
    await userEvent.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "运营角色",
      description: "负责运营后台",
      permissions: ["users.read"],
      dataScopeType: "ALL",
      dataScopeDeptIds: [],
    });
  });

  it("keeps custom data scope department ids when editing a role", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <RoleFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        role={customRole}
        permissionGroups={permissionGroups}
        deptTree={deptTree}
      />
    );

    expect(screen.getByLabelText("产品部")).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "项目专员",
      description: "负责项目",
      permissions: ["users.read"],
      dataScopeType: "CUSTOM",
      dataScopeDeptIds: ["dept_product"],
    });
  });
});
