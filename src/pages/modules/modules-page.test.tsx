import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModulesPage } from "./ModulesPage";

describe("ModulesPage", () => {
  it("renders module manifests with compile-time boundary", () => {
    render(<ModulesPage />);

    expect(screen.getByRole("heading", { name: "模块清单" })).toBeInTheDocument();
    expect(screen.getByText("远程插件与运行时远程插件不在默认支持范围")).toBeInTheDocument();
    expect(screen.getByText("modules.read")).toBeInTheDocument();
    expect(screen.getByText("任务调度")).toBeInTheDocument();
    expect(screen.getByText("监控告警")).toBeInTheDocument();
  });
});
