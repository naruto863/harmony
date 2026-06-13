import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type Column } from "./DataTable";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

type Row = {
  id: string;
  name: string;
  status: string;
};

const columns: Column<Row>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "status", label: "Status" },
];

describe("DataTable", () => {
  it("renders rows and columns", () => {
    render(
      <DataTable
        data={[{ id: "1", name: "Harmony", status: "active" }]}
        columns={columns}
        enableColumnToggle={false}
        enableColumnResize={false}
      />
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Harmony")).toBeInTheDocument();
  });

  it("renders a dedicated search empty state", () => {
    render(
      <DataTable
        data={[{ id: "1", name: "Harmony", status: "active" }]}
        columns={columns}
        searchPlaceholder="Search"
        searchKeys={["name"]}
        enableColumnToggle={false}
        enableColumnResize={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "missing" } });

    expect(screen.getByText("未找到匹配结果")).toBeInTheDocument();
  });

  it("renders api unavailable errors with trace id and field errors", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        errorState={{
          message: "接口不可用",
          traceId: "trace-1",
          fieldErrors: {
            email: ["邮箱格式错误"],
          },
        }}
        enableColumnToggle={false}
        enableColumnResize={false}
      />
    );

    expect(screen.getByText("接口不可用")).toBeInTheDocument();
    expect(screen.getByText("TraceId: trace-1")).toBeInTheDocument();
    expect(screen.getByText("email：邮箱格式错误")).toBeInTheDocument();
  });

  it("renders partial failure feedback after batch actions", async () => {
    render(
      <DataTable
        data={[
          { id: "1", name: "Harmony", status: "active" },
          { id: "2", name: "Codex", status: "inactive" },
        ]}
        columns={columns}
        batchActions={[
          {
            label: "批量禁用",
            onClick: () => ({
              successCount: 1,
              failed: [{ id: "2", message: "无权限" }],
            }),
          },
        ]}
        enableColumnToggle={false}
        enableColumnResize={false}
      />
    );

    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByText("批量禁用"));

    expect(await screen.findByText("1 项操作失败")).toBeInTheDocument();
    expect(screen.getByText("2：无权限")).toBeInTheDocument();
  });
});
