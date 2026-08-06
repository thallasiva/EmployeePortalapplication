import { useState, useEffect } from "react";
import { menuPermissionsApi } from "../api/settings.api";

const CACHE_KEY = "hrms_menu_permissions";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Map the stored user's roleName to the key used in MenuPermissionBuilder.
 * The auth service returns `roleName` from the DB (e.g. "Admin", "HR Manager", "Finance", etc.)
 * Numeric role_id 1 = Admin role by convention, but roleName gives the actual name.
 */
function resolveRoleName(user) {
  // Prefer the string roleName from auth service
  if (user?.roleName) return user.roleName;
  // Fallback numeric mapping
  const n = Number(user?.role);
  if (n === 1) return "Admin";
  if (n === 3) return "Manager";
  if (n === 4 || n === 5) return "Recruiter";
  return "Employee";
}

function isSuperAdmin(user) {
  // Super Admin = role 1 AND roleName is "Admin" (or no roleName — legacy super admin)
  const n = Number(user?.role);
  if (n !== 1) return false;
  const rn = user?.roleName?.toLowerCase?.() || "admin";
  return rn === "admin" || rn === "super admin" || rn === "super_admin";
}

export function useMenuPermissions(user) {
  const [perms, setPerms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try cache first
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached._ts < CACHE_TTL) {
        setPerms(cached.data);
        setLoading(false);
        return;
      }
    } catch {}

    menuPermissionsApi.get()
      .then(data => {
        setPerms(data || {});
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data || {}, _ts: Date.now() }));
        } catch {}
      })
      .catch(() => setPerms({}))
      .finally(() => setLoading(false));
  }, []);

  /**
   * isAllowed(menuId) → boolean
   * - Super Admin → always true
   * - Others → check stored permission for their role; default true if no config yet
   */
  const isAllowed = (menuId) => {
    if (isSuperAdmin(user)) return true;

    const roleName = resolveRoleName(user);
    if (!perms || !perms[roleName]) return true; // no config saved yet = open access

    const rolePerms = perms[roleName];
    if (typeof rolePerms[menuId] === "boolean") return rolePerms[menuId];
    return true; // unset item = allowed
  };

  return { isAllowed, loading, isSuperAdmin: isSuperAdmin(user) };
}

/** Call this after saving MenuPermissionBuilder to force a fresh fetch next time */
export function bustMenuPermissionsCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}
