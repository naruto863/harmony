import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFileDownloadUrl,
  getFilePreviewUrl,
  getUploadPolicy,
} from "./fileService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-file",
  timestamp: "2026-06-13T00:00:00Z",
}), { status: 200 });

describe("fileService production integration contracts", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads upload policy from /api/files/upload-policy", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      maxFileSize: 10485760,
      allowedMimeTypes: ["image/png", "application/pdf"],
      maxFilesPerUpload: 5,
      remainingQuota: 52428800,
      storageStrategy: "external-object-storage",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getUploadPolicy({ tenantId: "tenant_1", parentId: "folder_1" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9080/api/files/upload-policy?tenantId=tenant_1&parentId=folder_1",
      expect.any(Object),
    );
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      maxFileSize: 10485760,
      maxFilesPerUpload: 5,
    });
  });

  it("loads short-lived authenticated download URLs", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      url: "https://files.example.test/download/file_1",
      expiresAt: "2026-06-13T00:10:00Z",
    })));

    const result = await getFileDownloadUrl("file_1");

    expect(result).toEqual({
      success: true,
      data: {
        url: "https://files.example.test/download/file_1",
        expiresAt: "2026-06-13T00:10:00Z",
      },
    });
  });

  it("loads preview URLs and preserves preview unavailable reasons", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      previewable: false,
      reason: "此文件类型暂不支持在线预览",
    })));

    const result = await getFilePreviewUrl("file_1");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      previewable: false,
      reason: "此文件类型暂不支持在线预览",
    });
  });
});
