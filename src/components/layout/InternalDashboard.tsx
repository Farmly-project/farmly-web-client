// src/layouts/InternalDashboardLayout.tsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ClipboardList,
  FolderTree,
  Leaf,
  LogOut,
  Menu,
  MessageSquareWarning,
  PackageCheck,
  Settings,
  Sprout,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { internalApi } from "../../services/internalApi";
import type {
  AuthUser,
  InternalRole,
  NotificationItem,
} from "../../types/internalTypes";

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

interface MenuGroup {
  groupLabel: string;
  roles: InternalRole[]; // Admin luôn thấy tất cả nhóm
  items: Array<{
    to: string;
    label: string;
    icon: React.ReactNode;
  }>;
}

const MENU_GROUPS: MenuGroup[] = [
  {
    groupLabel: "Quản trị & Thống kê",
    roles: ["admin"],
    items: [
      {
        to: "/dashboard/admin/overview",
        label: "Tổng quan & Báo cáo",
        icon: <BarChart3 size={18} />,
      },
      {
        to: "/dashboard/admin/catalog",
        label: "Danh mục & Sản phẩm",
        icon: <FolderTree size={18} />,
      },
      {
        to: "/dashboard/admin/accounts",
        label: "Nhân sự nội bộ",
        icon: <Users size={18} />,
      },
      {
        to: "/dashboard/admin/settings",
        label: "Cấu hình hệ thống",
        icon: <Settings size={18} />,
      },
    ],
  },
  {
    groupLabel: "Vận hành Nông trại",
    roles: ["farm_staff"],
    items: [
      {
        to: "/dashboard/farm/batches",
        label: "Lô hàng, Nhật ký & QR",
        icon: <Sprout size={18} />,
      },
      {
        to: "/dashboard/farm/disposals",
        label: "Xuất hủy & Hao hụt",
        icon: <Trash2 size={18} />,
      },
    ],
  },
  {
    groupLabel: "Bán hàng & CSKH",
    roles: ["sales"],
    items: [
      {
        to: "/dashboard/sales/orders",
        label: "Duyệt đơn FEFO & Giao vận",
        icon: <PackageCheck size={18} />,
      },
      {
        to: "/dashboard/sales/complaints",
        label: "Khiếu nại & Đổi trả 24h",
        icon: <MessageSquareWarning size={18} />,
      },
    ],
  },
];

const ROLE_BADGE_MAP: Record<string, string> = {
  admin: "Quản trị viên (Full quyền)",
  farm_staff: "Kỹ sư / NV Nông trại",
  sales: "Nhân viên Bán hàng / CSKH",
};

export const InternalDashboardLayout: React.FC<Props> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await internalApi.getNotifications({ limit: 15 });
      setNotifications(res.data.data.items || []);
      setUnreadCount(res.data.data.unread_count || 0);
    } catch {
      // Bỏ qua lỗi mạng nhẹ khi polling thông báo
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 45000);
    return () => clearInterval(timer);
  }, []);

  const handleReadNotif = async (notif: NotificationItem) => {
    if (!notif.read_at) {
      await internalApi.markNotificationRead(notif.id);
      loadNotifications();
    }
    if (notif.type === "BATCH_NEAR_EXPIRY") {
      navigate("/dashboard/sales/orders");
    } else if (notif.type === "NEW_COMPLAINT") {
      navigate("/dashboard/sales/complaints");
    } else if (notif.type === "BATCH_EXPIRED_DISPOSAL_REQUIRED") {
      navigate("/dashboard/farm/disposals");
    }
    setNotifOpen(false);
  };

  // Admin thấy toàn bộ nhóm; Farm Staff / Sales chỉ thấy nhóm thuộc vai trò của mình
  const visibleGroups = MENU_GROUPS.filter(
    (g) => user.role === "admin" || g.roles.includes(user.role as InternalRole),
  );

  // Đếm cảnh báo đỏ lô cận hạn chưa đọc
  const redAlerts = notifications.filter(
    (n) => !n.read_at && (n.level === "danger" || n.level === "red"),
  );

  return (
    <div className="min-h-screen flex bg-[#F7FBF7] text-slate-800">
      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-farmly-mint border-r border-farmly-soft flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-farmly-soft">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-farmly-dark text-white flex items-center justify-center shadow-sm">
              <Leaf size={20} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-farmly-dark block leading-none">
                FARMLY
              </span>
              <span className="text-[11px] font-medium text-farmly-dot">
                Hệ thống Vận hành Nội bộ
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-farmly-dark hover:bg-white/60"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Role Card */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-white/85 border border-farmly-soft">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-farmly-dot shrink-0" />
            <p className="text-sm font-semibold text-farmly-dark truncate">
              {user.full_name}
            </p>
          </div>
          <span className="mt-1.5 inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-farmly-badge text-white">
            {ROLE_BADGE_MAP[user.role] || user.role}
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {visibleGroups.map((group) => (
            <div key={group.groupLabel}>
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-farmly-dark/65">
                {group.groupLabel}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-farmly-dark text-white shadow-sm"
                          : "text-farmly-dark hover:bg-white/75"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-farmly-soft">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-farmly-soft bg-white text-farmly-dark text-sm font-semibold hover:bg-farmly-cream transition"
          >
            <LogOut size={16} />
            Đăng xuất hệ thống
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Cream Announcement Banner khi có lô cận hạn / quá hạn */}
        {redAlerts.length > 0 && (
          <div className="bg-farmly-cream border-b border-farmly-soft px-4 py-2 text-xs sm:text-sm text-farmly-badge flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium truncate">
              <span className="px-2 py-0.5 rounded bg-farmly-badge text-white text-[11px] font-bold shrink-0">
                CẢNH BÁO KHO ({redAlerts.length})
              </span>
              <span className="truncate">
                {redAlerts[0].title}: {redAlerts[0].body}
              </span>
            </div>
            <button
              onClick={() => handleReadNotif(redAlerts[0])}
              className="shrink-0 underline font-semibold hover:opacity-80"
            >
              Xử lý ngay →
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-farmly-soft px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-farmly-soft text-farmly-dark"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm text-farmly-dark font-medium">
              <ClipboardList size={18} className="text-farmly-dot" />
              <span>Bảng điều khiển Nông sản sạch Farmly</span>
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2.5 rounded-xl bg-farmly-mint border border-farmly-soft text-farmly-dark hover:opacity-90 transition"
              title="Thông báo vận hành"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-20px h-5 px-1 rounded-full bg-farmly-badge text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-farmly-soft overflow-hidden z-50">
                <div className="px-4 py-3 bg-farmly-mint border-b border-farmly-soft flex items-center justify-between">
                  <span className="text-sm font-bold text-farmly-dark">
                    Thông báo nội bộ ({unreadCount} chưa đọc)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        await internalApi.markAllNotificationsRead();
                        loadNotifications();
                      }}
                      className="text-xs font-semibold text-farmly-dot hover:underline"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-farmly-soft/60">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-500">
                      Chưa có thông báo mới.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleReadNotif(n)}
                        className={`w-full text-left p-3.5 hover:bg-farmly-mint/40 transition block ${
                          !n.read_at ? "bg-farmly-cream/50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-farmly-dark">
                            {n.title}
                          </span>
                          {(n.level === "danger" || n.level === "red") && (
                            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                              KHẨN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {n.body}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
