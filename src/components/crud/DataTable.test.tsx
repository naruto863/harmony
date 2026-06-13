import { render, screen } from "@testing-library/react";
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
});
