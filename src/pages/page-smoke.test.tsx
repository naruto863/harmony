import type React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { UsersPage } from "./users/UsersPage";
import { RolesPage } from "./roles/RolesPage";
import { FilesPage } from "./files/FilesPage";
import { MessageCenterPage } from "./messages/MessageCenterPage";

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({
    currentTenant: {
      id: "tenant_demo",
      name: "Demo 公司",
      plan: "pro",
      createdAt: "2026-05-28T00:00:00Z",
      updatedAt: "2026-05-28T00:00:00Z",
    },
    userTenants: [],
    isLoading: false,
    selectTenant: vi.fn(),
    switchTenant: vi.fn(),
    setCurrentTenant: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user_admin",
      email: "admin@example.com",
      name: "管理员",
      status: "active",
      createdAt: "2026-05-28T00:00:00Z",
      updatedAt: "2026-05-28T00:00:00Z",
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/components/guards", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/demoMode", () => ({
  demoStorageKey: (key: string) => `ha_demo:${key}`,
  isDemoModeEnabled: () => false,
  requireDemoMode: vi.fn(),
}));

vi.mock("@/services/userService", () => ({
  getUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  }),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  removeUserFromTenant: vi.fn(),
  batchRemoveUsers: vi.fn(),
  batchUpdateUserStatus: vi.fn(),
  resetUserPassword: vi.fn(),
}));

vi.mock("@/services/roleService", () => ({
  getRoles: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  getPermissionGroups: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/services/deptService", () => ({
  getDeptTree: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/services/importExportService", () => ({
  createExportTask: vi.fn().mockResolvedValue({ id: "task_export" }),
  createImportTaskFromFile: vi.fn().mockResolvedValue({ id: "task_import" }),
}));

vi.mock("@/services/fileService", () => ({
  getFiles: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
  getFolderPath: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getStorageStats: vi.fn().mockResolvedValue({
    success: true,
    data: { used: 0, total: 1024, fileCount: 0, folderCount: 0 },
  }),
  getUploadPolicy: vi.fn().mockResolvedValue({
    success: true,
    data: {
      maxFileSize: 1024,
      allowedMimeTypes: ["text/plain"],
      maxFilesPerUpload: 1,
      remainingQuota: 1024,
      storageStrategy: "external-api",
    },
  }),
  getFileDownloadUrl: vi.fn(),
  getFilePreviewUrl: vi.fn(),
  createFolder: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  batchDeleteFiles: vi.fn(),
  formatFileSize: (bytes: number) => `${bytes} B`,
  getFileIconType: () => "file",
}));

vi.mock("@/services/notificationService", () => ({
  getNotifications: vi.fn().mockResolvedValue([]),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  toggleStar: vi.fn(),
  archiveNotification: vi.fn(),
  archiveMultiple: vi.fn(),
  deleteNotification: vi.fn(),
  deleteMultiple: vi.fn(),
  addNotification: vi.fn(),
  getNoticeReadStats: vi.fn().mockResolvedValue({ noticeId: "n1", total: 0, read: 0, unread: 0, readRate: 0 }),
  getNoticeTemplates: vi.fn().mockResolvedValue([]),
  createNoticeTemplate: vi.fn(),
  updateNoticeTemplate: vi.fn(),
  deleteNoticeTemplate: vi.fn(),
  getEmailMessages: vi.fn().mockResolvedValue([]),
  getUnreadEmailCount: vi.fn().mockResolvedValue(0),
  getEmailFolderCounts: vi.fn().mockResolvedValue({ inbox: 0, sent: 0, drafts: 0, trash: 0, spam: 0 }),
  getCategoryIcon: () => "Bell",
  getCategoryLabel: () => "系统",
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const renderPage = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("key page smoke tests", () => {
  it("renders the users page shell", () => {
    renderPage(<UsersPage />);

    expect(screen.getByRole("heading", { name: "用户管理" })).toBeInTheDocument();
  });

  it("renders the roles page shell", () => {
    renderPage(<RolesPage />);

    expect(screen.getByRole("heading", { name: "角色权限" })).toBeInTheDocument();
  });

  it("renders the files page shell", () => {
    renderPage(<FilesPage />);

    expect(screen.getByRole("heading", { name: "文件中心" })).toBeInTheDocument();
  });

  it("renders the message center shell", () => {
    renderPage(<MessageCenterPage />);

    expect(screen.getByRole("heading", { name: "消息中心" })).toBeInTheDocument();
  });
});
