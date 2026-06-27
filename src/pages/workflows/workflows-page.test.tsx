import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowsPage } from "./WorkflowsPage";

vi.mock("@/services/workflowService", () => ({
  getWorkflowDefinitions: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: "wf_leave", name: "请假审批", status: "active", version: 1 }],
  }),
  getWorkflowInstances: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: "inst_1", definitionId: "wf_leave", title: "年假申请", status: "running", currentNodeName: "部门审批" }],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  }),
}));

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ currentTenant: { id: "tenant_demo", name: "Demo 公司" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("WorkflowsPage", () => {
  it("renders workflow and dynamic form template boundaries", async () => {
    render(<WorkflowsPage />);

    expect(screen.getByRole("heading", { name: "工作流模板" })).toBeInTheDocument();
    expect(await screen.findByText("请假审批")).toBeInTheDocument();
    expect(screen.getByText("动态表单字段白名单")).toBeInTheDocument();
    expect(screen.getByText("流程执行、节点权限和历史真实性由 external API 负责")).toBeInTheDocument();
    expect(screen.getByText("workflows.instances.start")).toBeInTheDocument();
    expect(screen.getByText("forms.schemas.preview")).toBeInTheDocument();
  });
});
