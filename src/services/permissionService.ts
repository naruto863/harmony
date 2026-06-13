import { apiClient } from "./apiClient";
import { demoGetMyPermissions, isDemoApiEnabled } from "./demoApi";

export const getMyPermissions = () => {
  if (isDemoApiEnabled()) {
    return demoGetMyPermissions();
  }
  return apiClient.get<string[]>("/api/permissions/mine");
};
