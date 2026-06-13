import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNoticeTemplate,
  deleteNoticeTemplate,
  getNoticeReadStats,
  getNoticeTemplates,
  updateNoticeTemplate,
} from "./notificationService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-notice",
  timestamp: "2026-06-13T00:00:00Z",
}), { status: 200 });

describe("notificationService notice templates and read stats", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads notice templates from the external API", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse([
      {
        id: "tpl_1",
        name: "维护公告",
        title: "系统维护通知",
        content: "今晚维护",
        status: "active",
        updatedAt: "2026-06-13T00:00:00Z",
      },
    ])));

    await expect(getNoticeTemplates()).resolves.toEqual([
      expect.objectContaining({ id: "tpl_1", title: "系统维护通知" }),
    ]);
  });

  it("creates, updates, and deletes notice templates through /api/notices/templates", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      id: "tpl_1",
      name: "维护公告",
      title: "系统维护通知",
      content: "今晚维护",
      status: "active",
      updatedAt: "2026-06-13T00:00:00Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await createNoticeTemplate({ name: "维护公告", title: "系统维护通知", content: "今晚维护" });
    await updateNoticeTemplate("tpl_1", { title: "维护延期通知" });
    await deleteNoticeTemplate("tpl_1");

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/notices/templates",
      "http://localhost:9080/api/notices/templates/tpl_1",
      "http://localhost:9080/api/notices/templates/tpl_1",
    ]);
  });

  it("loads notice read statistics", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
      noticeId: "notice_1",
      total: 10,
      read: 7,
      unread: 3,
      readRate: 70,
      unreadMembers: [{ userId: "user_1", userName: "Alice" }],
    })));

    await expect(getNoticeReadStats("notice_1")).resolves.toMatchObject({
      noticeId: "notice_1",
      read: 7,
      unread: 3,
      readRate: 70,
    });
  });
});
