import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpenApiDraftPage } from "./OpenApiDraftPage";

describe("OpenApiDraftPage", () => {
  it("renders OpenAPI draft workflow with preview-only boundary", () => {
    render(<OpenApiDraftPage />);

    expect(screen.getByRole("heading", { name: "OpenAPI 辅助" })).toBeInTheDocument();
    expect(screen.getByText("权限码建议")).toBeInTheDocument();
    expect(screen.getByText("菜单草稿")).toBeInTheDocument();
    expect(screen.getByText("只生成草稿预览，不自动写入文件或执行远程脚本")).toBeInTheDocument();
    expect(screen.getByText("developer.openapi.read")).toBeInTheDocument();
  });
});
