import { CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Drawer,
  Empty,
  Layout,
  Menu,
  Modal,
  Message,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconCustomerService,
  IconCode,
  IconDashboard,
  IconDown,
  IconFile,
  IconHome,
  IconIdcard,
  IconList,
  IconMessage,
  IconMenuFold,
  IconMenuUnfold,
  IconNotification,
  IconQuestionCircle,
  IconQrcode,
  IconRobot,
  IconSafe,
  IconSettings,
  IconStorage,
  IconUser,
  IconUserGroup,
} from '@arco-design/web-react/icon';
import { getAppRouteMeta } from '../config/appRoutes';
import {
  TenantDocsModalContent,
  TenantGuideModalContent,
} from '../pages/tenant/TenantHelpPages';
import { NOTIFICATION_CHANGE_EVENT } from '../services/notificationMockApi';
import { mockApi } from '../services/mockApi';
import type { NotificationInboxItem, RoleKey } from '../types/domain';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const notificationRouteByRole: Record<RoleKey, string> = {
  platformAdmin: '/admin/notifications',
  finance: '/finance/notifications',
  deliveryAdmin: '/ops-admin/notifications',
  deliveryOps: '/ops/notifications',
  salesAdmin: '/sales-admin/notifications',
  sales: '/sales/notifications',
  tenantAdmin: '/tenant/notifications',
};

const notificationCategoryMeta = {
  order: { color: 'arcoblue', text: '订单' },
  review: { color: 'orange', text: '审核' },
  onboarding: { color: 'green', text: '开通交付' },
  lead: { color: 'purple', text: '咨询留资' },
  commission: { color: 'gold', text: '佣金结算' },
  system: { color: 'red', text: '系统' },
} as const;

const roleRoutes: Record<RoleKey, string> = {
  platformAdmin: '/admin/dashboard',
  finance: '/finance/dashboard',
  deliveryAdmin: '/ops-admin/tickets',
  deliveryOps: '/ops/tickets',
  salesAdmin: '/sales-admin/coupons',
  sales: '/sales/profile',
  tenantAdmin: '/tenant/overview',
};

type AgentMirrorRole = 'agentAdmin' | 'agentSales' | 'agentFinance';

const agentMirrorRoleRoutes: Record<AgentMirrorRole, string> = {
  agentAdmin: '/agent/admin',
  agentSales: '/agent/sales',
  agentFinance: '/agent/finance',
};

const agentMirrorRoleLabels: Record<AgentMirrorRole, string> = {
  agentAdmin: '超级管理员（代理）',
  agentSales: '销售',
  agentFinance: '代理财务',
};

const agentMirrorNotificationRoutes: Record<AgentMirrorRole, string> = {
  agentAdmin: '/agent/admin/notifications',
  agentSales: '/agent/sales/notifications',
  agentFinance: '/agent/finance/notifications',
};

interface NavItem {
  path: string;
  label: string;
  icon?: ReactNode;
  indent?: boolean;
  children?: NavItem[];
}

const tenantNavGroups: { title: string; items: NavItem[] }[] = [
  { title: '', items: [{ path: '/tenant/overview', label: '空间概览', icon: <IconHome /> }] },
  {
    title: '核心管理',
    items: [
      { path: '/tenant/claws', label: 'Claw 列表', icon: <IconRobot /> },
      { path: '/tenant/users', label: '用户管理', icon: <IconUserGroup /> },
      { path: '/tenant/seats', label: '席位管理', icon: <IconStorage /> },
    ],
  },
  {
    title: '权益与用量',
    items: [
      { path: '/tenant/billing', label: '购买与账单', icon: <IconFile /> },
      { path: '/tenant/contracts', label: '合同管理', icon: <IconFile /> },
      { path: '/tenant/observability', label: '用量中心', icon: <IconDashboard /> },
    ],
  },
  {
    title: '开发者接口',
    items: [
      { path: '/tenant/api-keys', label: 'API 密钥', icon: <IconCode /> },
    ],
  },
  {
    title: '服务支持',
    items: [
      { path: '/tenant/consult', label: '工单与咨询', icon: <IconCustomerService /> },
      { path: '/tenant/notifications', label: '通知中心', icon: <IconNotification /> },
    ],
  },
];

const navGroupsByRole: Record<RoleKey, { title: string; items: NavItem[] }[]> = {
  tenantAdmin: tenantNavGroups,
  platformAdmin: [
    {
      title: '',
      items: [
        { path: '/admin/dashboard', label: '全局仪表盘', icon: <IconDashboard /> },
        { path: '/admin/orders', label: '订单总览', icon: <IconFile /> },
      ],
    },
    {
      title: '客户经营',
      items: [
        { path: '/admin/tenants', label: '企业管理', icon: <IconUserGroup /> },
      ],
    },
    {
      title: '交付与支持',
      items: [
        {
          path: '/admin/tickets',
          label: '工单管理',
          icon: <IconList />,
          children: [
            { path: '/admin/delivery-tickets', label: '交付工单', indent: true },
            { path: '/admin/support-tickets', label: '支持工单', indent: true },
          ],
        },
      ],
    },
    {
      title: '财务与票据',
      items: [
        { path: '/admin/orders/bank-transfer-review', label: '对公审核', icon: <IconFile /> },
        { path: '/admin/orders/invoices', label: '发票管理', icon: <IconFile /> },
        {
          path: '/admin/commission/transactions',
          label: '佣金管理',
          icon: <IconStorage />,
          children: [
            { path: '/admin/commission/transactions', label: '佣金流水', indent: true },
            { path: '/admin/commission/rules', label: '结算规则', indent: true },
          ],
        },
      ],
    },
    {
      title: '销售与渠道',
      items: [
        { path: '/admin/sales', label: '内部销售', icon: <IconUser /> },
        { path: '/admin/agents', label: '外部代理', icon: <IconUserGroup /> },
      ],
    },
    {
      title: '产品与权益',
      items: [
        { path: '/admin/plans', label: '套餐与价格', icon: <IconSettings /> },
        { path: '/admin/coupons', label: '代金券与优惠券', icon: <IconQrcode /> },
      ],
    },
    {
      title: '组织与系统',
      items: [
        { path: '/admin/staff', label: '内部员工账号', icon: <IconIdcard /> },
        { path: '/admin/notifications', label: '通知中心', icon: <IconNotification /> },
      ],
    },
  ],
  finance: [
    { title: '', items: [{ path: '/finance/dashboard', label: '财务仪表盘', icon: <IconDashboard /> }] },
    {
      title: '主流程管理',
      items: [
        { path: '/finance/tenants', label: '企业管理', icon: <IconUserGroup /> },
        {
          path: '/finance/orders',
          label: '订单与账单',
          icon: <IconFile />,
          children: [
            { path: '/finance/orders', label: '订单总览', indent: true },
            { path: '/finance/orders/invoices', label: '发票管理', indent: true },
            { path: '/finance/orders/bank-transfer-review', label: '对公审核', indent: true },
          ],
        },
      ],
    },
    {
      title: '代理与结算',
      items: [
        {
          path: '/finance/commission/transactions',
          label: '销售结算',
          icon: <IconStorage />,
          children: [
            { path: '/finance/sales', label: '销售账户', indent: true },
            { path: '/finance/commission/transactions', label: '提现流水', indent: true },
            { path: '/finance/commission/rules', label: '结算规则', indent: true },
          ],
        },
        { path: '/finance/plans', label: '套餐与价格', icon: <IconSettings /> },
        { path: '/finance/notifications', label: '通知中心', icon: <IconNotification /> },
      ],
    },
  ],
  deliveryAdmin: [
    {
      title: '',
      items: [
        {
          path: '/ops-admin/tickets',
          label: '工单管理',
          icon: <IconList />,
          children: [
            { path: '/ops-admin/delivery-tickets', label: '交付工单', indent: true },
            { path: '/ops-admin/support-tickets', label: '支持工单', indent: true },
          ],
        },
      ],
    },
    {
      title: '企业交付',
      items: [
        { path: '/ops-admin/tenants', label: '企业管理', icon: <IconUserGroup /> },
        {
          path: '/ops-admin/orders',
          label: '订单与账单',
          icon: <IconFile />,
          children: [
            { path: '/ops-admin/orders', label: '订单总览', indent: true },
            { path: '/ops-admin/orders/bank-transfer-review', label: '对公审核', indent: true },
          ],
        },
        { path: '/ops-admin/notifications', label: '通知中心', icon: <IconNotification /> },
      ],
    },
  ],
  deliveryOps: [
    {
      title: '',
      items: [
        {
          path: '/ops/tickets',
          label: '我的工单',
          icon: <IconList />,
          children: [
            { path: '/ops/delivery-tickets', label: '交付工单', indent: true },
            { path: '/ops/support-tickets', label: '支持工单', indent: true },
          ],
        },
      ],
    },
    {
      title: '企业交付',
      items: [
        { path: '/ops/tenants', label: '企业管理', icon: <IconUserGroup /> },
        {
          path: '/ops/orders',
          label: '订单与账单',
          icon: <IconFile />,
          children: [
            { path: '/ops/orders', label: '订单总览', indent: true },
            { path: '/ops/orders/bank-transfer-review', label: '对公审核', indent: true },
          ],
        },
        { path: '/ops/notifications', label: '通知中心', icon: <IconNotification /> },
      ],
    },
  ],
  sales: [
    {
      title: '',
      items: [
        { path: '/sales/profile', label: '销售个人中心', icon: <IconUser /> },
        { path: '/sales/coupons', label: '优惠券', icon: <IconQrcode /> },
        { path: '/sales/leads', label: '咨询工单池', icon: <IconMessage /> },
        { path: '/sales/customers', label: '我的客户池', icon: <IconUserGroup /> },
        { path: '/sales/opening-tasks', label: '订单跟进', icon: <IconList /> },
        { path: '/sales/commission', label: '佣金明细', icon: <IconFile /> },
        { path: '/sales/notifications', label: '通知中心', icon: <IconNotification /> },
      ],
    },
  ],
  salesAdmin: [
    {
      title: '',
      items: [
        { path: '/sales-admin/coupons', label: '优惠券分配', icon: <IconQrcode /> },
        { path: '/sales-admin/profile', label: '销售个人中心', icon: <IconUser /> },
        { path: '/sales-admin/leads', label: '咨询工单池', icon: <IconMessage /> },
        { path: '/sales-admin/customers', label: '我的客户池', icon: <IconUserGroup /> },
        { path: '/sales-admin/opening-tasks', label: '订单跟进', icon: <IconList /> },
        { path: '/sales-admin/commission', label: '佣金明细', icon: <IconFile /> },
        { path: '/sales-admin/notifications', label: '通知中心', icon: <IconNotification /> },
      ],
    },
  ],
};

const sideProductByRole: Record<RoleKey, string> = {
  platformAdmin: '超级管理后台',
  finance: '财务后台',
  deliveryAdmin: '交付管理后台',
  deliveryOps: '交付运维后台',
  salesAdmin: '销售管理工作台',
  sales: '销售工作台',
  tenantAdmin: 'ArkClaw 企业版',
};

const resolveAgentMirrorRole = (pathname: string): AgentMirrorRole => {
  if (pathname.startsWith('/agent/sales')) return 'agentSales';
  if (pathname.startsWith('/agent/finance')) return 'agentFinance';
  return 'agentAdmin';
};

const agentMirrorDataRole: Record<AgentMirrorRole, RoleKey> = {
  agentAdmin: 'platformAdmin',
  agentSales: 'sales',
  agentFinance: 'finance',
};

const toAgentMirrorPath = (path: string, mirrorRole: AgentMirrorRole) => {
  if (mirrorRole === 'agentAdmin' && path.startsWith('/admin')) {
    const suffix = path.slice('/admin'.length);
    return `/agent/admin${suffix === '/dashboard' ? '' : suffix}`;
  }
  if (mirrorRole === 'agentSales' && path.startsWith('/sales')) {
    const suffix = path.slice('/sales'.length);
    return `/agent/sales${suffix === '/profile' ? '' : suffix}`;
  }
  if (mirrorRole === 'agentFinance' && path.startsWith('/finance')) {
    const suffix = path.slice('/finance'.length);
    return `/agent/finance${suffix === '/dashboard' ? '' : suffix}`;
  }
  return path;
};

const buildAgentMirrorNavGroups = (mirrorRole: AgentMirrorRole): { title: string; items: NavItem[] }[] => {
  if (mirrorRole === 'agentAdmin') {
    return [
      {
        title: '',
        items: [
          { path: '/agent/admin', label: '全局仪表盘', icon: <IconDashboard /> },
          { path: '/agent/admin/balance', label: '订单总览', icon: <IconFile /> },
        ],
      },
      {
        title: '客户经营',
        items: [
          { path: '/agent/admin/tenants', label: '企业管理', icon: <IconUserGroup /> },
        ],
      },
      {
        title: '交付与支持',
        items: [
          {
            path: '/agent/admin/tickets',
            label: '工单管理',
            icon: <IconList />,
            children: [
              { path: '/agent/admin/delivery-tickets', label: '交付工单', indent: true },
              { path: '/agent/admin/support-tickets', label: '支持工单', indent: true },
            ],
          },
        ],
      },
      {
        title: '财务与票据',
        items: [
          { path: '/agent/admin/orders/bank-transfer-review', label: '对公审核', icon: <IconFile /> },
          { path: '/agent/admin/orders/invoices', label: '发票管理', icon: <IconFile /> },
        ],
      },
      {
        title: '销售与佣金',
        items: [
          { path: '/agent/admin/sales', label: '销售管理', icon: <IconUser /> },
          {
            path: '/agent/admin/commission/transactions',
            label: '佣金管理',
            icon: <IconStorage />,
            children: [
              { path: '/agent/admin/commission/transactions', label: '提现流水', indent: true },
              { path: '/agent/admin/commission/rules', label: '结算规则', indent: true },
            ],
          },
        ],
      },
      {
        title: '产品与权益',
        items: [
          { path: '/agent/admin/plans', label: '套餐与价格', icon: <IconSettings /> },
          { path: '/agent/admin/coupons', label: '代金券与优惠券', icon: <IconQrcode /> },
        ],
      },
      {
        title: '组织与系统',
        items: [
          { path: '/agent/admin/website', label: '网站管理', icon: <IconHome /> },
          { path: '/agent/admin/staff', label: '员工账号', icon: <IconIdcard /> },
          { path: '/agent/admin/notifications', label: '通知中心', icon: <IconNotification /> },
        ],
      },
    ];
  }

  return navGroupsByRole[agentMirrorDataRole[mirrorRole]].map((group) => {
    const items = group.items.map((item) => ({
      ...item,
      label:
        mirrorRole === 'agentFinance' && item.path === '/finance/dashboard'
          ? '工作台'
          : mirrorRole === 'agentFinance' && item.path === '/finance/sales'
            ? '销售账户'
            : mirrorRole === 'agentFinance' && item.path === '/finance/orders'
              ? '采购订单'
              : item.label,
      path: toAgentMirrorPath(item.path, mirrorRole),
      children: item.children?.map((child) => ({
        ...child,
        label:
          mirrorRole === 'agentFinance' && child.path === '/finance/sales'
            ? '销售账户'
            : child.label,
        path: toAgentMirrorPath(child.path, mirrorRole),
      })),
    }));

    if (group.title === '代理与结算' && mirrorRole === 'agentFinance') {
      const balancePath = '/agent/finance/balance';
      const insertIndex = items.findIndex((item) => item.path === toAgentMirrorPath('/finance/plans', mirrorRole));
      const balanceItem = { path: balancePath, label: '采购与结算', icon: <IconStorage />, children: undefined };
      const nextItems = [...items];
      nextItems.splice(insertIndex >= 0 ? insertIndex : nextItems.length, 0, balanceItem);

      return {
        ...group,
        items: nextItems,
      };
    }

    return {
      ...group,
      items,
    };
  });
};

const toAgentMirrorActionUrl = (url: string, mirrorRole: AgentMirrorRole) => {
  if (mirrorRole === 'agentAdmin' && url.startsWith('/admin')) return toAgentMirrorPath(url, mirrorRole);
  if (mirrorRole === 'agentSales' && url.startsWith('/sales')) return toAgentMirrorPath(url, mirrorRole);
  if (mirrorRole === 'agentFinance' && url.startsWith('/finance')) return toAgentMirrorPath(url, mirrorRole);
  return url;
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [openBranches, setOpenBranches] = useState<Record<string, boolean>>({});
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationProcessing, setNotificationProcessing] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationInboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tenantGuideVisible, setTenantGuideVisible] = useState(false);
  const [tenantDocsVisible, setTenantDocsVisible] = useState(false);
  const [miniProgramGuideVisible, setMiniProgramGuideVisible] = useState(false);
  const routeMeta = getAppRouteMeta(location.pathname);
  const layoutMode = routeMeta?.layoutMode ?? 'workspace';
  const isDetailRoute = layoutMode === 'detail';
  const isFocusRoute = layoutMode === 'focus';
  const isFullscreenRoute = layoutMode === 'fullscreen';
  const hideSideNav = isDetailRoute || isFocusRoute || isFullscreenRoute;
  const showBreadcrumb = routeMeta?.showBreadcrumb ?? layoutMode === 'workspace';
  const isAgentMirror = location.pathname === '/agent' || location.pathname.startsWith('/agent/');
  const agentMirrorRole = useMemo(() => resolveAgentMirrorRole(location.pathname), [location.pathname]);

  const role: RoleKey = useMemo(() => {
    if (location.pathname === '/agent' || location.pathname.startsWith('/agent/')) {
      return agentMirrorDataRole[resolveAgentMirrorRole(location.pathname)];
    }
    if (location.pathname.startsWith('/admin')) return 'platformAdmin';
    if (location.pathname.startsWith('/finance')) return 'finance';
    if (location.pathname.startsWith('/ops-admin')) return 'deliveryAdmin';
    if (location.pathname.startsWith('/sales-admin')) return 'salesAdmin';
    if (location.pathname.startsWith('/sales')) return 'sales';
    if (location.pathname.startsWith('/ops')) return 'deliveryOps';
    return 'tenantAdmin';
  }, [location.pathname]);

  const activeNav = (path: string) => {
    if (
      path === '/tenant/overview' ||
      path === '/tenant/claws' ||
      path === '/tenant/templates' ||
      path === '/tenant/apps' ||
      path === '/tenant/knowledge' ||
      path === '/tenant/users' ||
      path === '/tenant/seats' ||
      path === '/tenant/billing' ||
      path === '/tenant/consult' ||
      path === '/tenant/batch-ops' ||
      path === '/tenant/brand' ||
      path === '/tenant/observability' ||
      path === '/tenant/notifications' ||
      path === '/admin/tenants' ||
      path === '/admin/orders' ||
      path === '/admin/sales' ||
      path === '/admin/commission/transactions' ||
      path === '/admin/plans' ||
      path === '/admin/leads' ||
      path === '/admin/staff' ||
      path === '/admin/tickets' ||
      path === '/admin/delivery-tickets' ||
      path === '/admin/support-tickets' ||
      path === '/finance/tenants' ||
      path === '/finance/orders' ||
      path === '/finance/sales' ||
      path === '/finance/commission/transactions' ||
      path === '/finance/plans' ||
      path === '/finance/notifications' ||
      path === '/ops-admin/tickets' ||
      path === '/ops-admin/delivery-tickets' ||
      path === '/ops-admin/support-tickets' ||
      path === '/ops-admin/tenants' ||
      path === '/ops-admin/orders' ||
      path === '/ops-admin/notifications' ||
      path === '/ops/tickets' ||
      path === '/ops/delivery-tickets' ||
      path === '/ops/support-tickets' ||
      path === '/ops/tenants' ||
      path === '/ops/orders' ||
      path === '/ops/notifications' ||
      path === '/sales-admin/coupons' ||
      path === '/sales-admin/customers' ||
      path === '/sales-admin/commission' ||
      path === '/sales-admin/leads' ||
      path === '/sales-admin/profile' ||
      path === '/sales-admin/opening-tasks' ||
      path === '/sales-admin/notifications' ||
      path === '/sales/customers' ||
      path === '/sales/share' ||
      path === '/sales/coupons' ||
      path === '/sales/commission' ||
      path === '/sales/leads' ||
      path === '/sales/profile' ||
      path === '/sales/notifications' ||
      path === '/agent/sales/coupons'
    ) {
      if (path === '/admin/commission/transactions') {
        return location.pathname.startsWith('/admin/commission');
      }
      if (path === '/admin/orders') {
        return location.pathname === '/admin/orders';
      }
      if (path === '/finance/commission/transactions') {
        return location.pathname.startsWith('/finance/commission') || location.pathname.startsWith('/finance/sales');
      }
      if (path === '/ops/orders') {
        return location.pathname.startsWith('/ops/orders');
      }
      if (path === '/ops-admin/orders') {
        return location.pathname.startsWith('/ops-admin/orders');
      }
      if (path === '/admin/tickets') {
        return location.pathname === '/admin/tickets' || location.pathname.startsWith('/admin/delivery-tickets') || location.pathname.startsWith('/admin/support-tickets');
      }
      if (path === '/ops/tickets') {
        return location.pathname === '/ops/tickets' || location.pathname.startsWith('/ops/delivery-tickets') || location.pathname.startsWith('/ops/support-tickets');
      }
      if (path === '/ops-admin/tickets') {
        return location.pathname === '/ops-admin/tickets' || location.pathname.startsWith('/ops-admin/delivery-tickets') || location.pathname.startsWith('/ops-admin/support-tickets');
      }
      if (path === '/finance/orders') {
        return location.pathname.startsWith('/finance/orders');
      }
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }
    if (path.startsWith('/agent/')) {
      if (path === '/agent/admin' || path === '/agent/finance' || path === '/agent/sales') {
        return location.pathname === path;
      }
      if (path === '/agent/admin/tickets') {
        return (
          location.pathname === '/agent/admin/tickets' ||
          location.pathname.startsWith('/agent/admin/delivery-tickets') ||
          location.pathname.startsWith('/agent/admin/support-tickets')
        );
      }
      if (path === '/agent/admin/orders') {
        return location.pathname === '/agent/admin/orders';
      }
      if (path === '/agent/admin/balance') {
        return location.pathname === '/agent/admin/balance' || location.pathname === '/agent/admin/orders';
      }
      if (path === '/agent/admin/commission/transactions') {
        return location.pathname.startsWith('/agent/admin/commission');
      }
      if (path === '/agent/admin/sales') {
        return location.pathname.startsWith('/agent/admin/sales');
      }
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }
    if (path === '/tenant/ops') {
      return (
        location.pathname === '/tenant/ops' ||
        location.pathname.startsWith('/tenant/batch-ops') ||
        location.pathname.startsWith('/tenant/observability') ||
        location.pathname.startsWith('/tenant/audit')
      );
    }
    return location.pathname === path;
  };

  const navGroups = useMemo(
    () => (isAgentMirror ? buildAgentMirrorNavGroups(agentMirrorRole) : navGroupsByRole[role]),
    [agentMirrorRole, isAgentMirror, role],
  );
  const navWidth = hideSideNav ? 0 : navCollapsed ? 60 : 200;
  const sideProduct = isAgentMirror ? '代理镜像站' : sideProductByRole[role];
  const brandTitle = isAgentMirror ? '代理镜像站' : '云脑智联 × ArkClaw';
  const roleSelectValue = role;
  const notificationListRoute = isAgentMirror ? agentMirrorNotificationRoutes[agentMirrorRole] : notificationRouteByRole[role];
  const showMiniProgramEntry = role === 'tenantAdmin' || (isAgentMirror && agentMirrorRole === 'agentAdmin');
  const miniProgramPage = role === 'tenantAdmin' ? 'pages/tenant/index' : 'pages/agent/index';
  const shellStyle = {
    '--side-nav-width': `${navWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    const nextOpen: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children?.length && activeNav(item.path)) {
          nextOpen[item.path] = true;
        }
      });
    });
    if (Object.keys(nextOpen).length) {
      setOpenBranches((current) => ({ ...current, ...nextOpen }));
    }
  }, [location.pathname, navGroups]);

  const loadUnreadCount = async () => {
    const result = await mockApi.getNotificationUnreadCount(role);
    setUnreadCount(result.count);
  };

  const loadRecentNotifications = async () => {
    setNotificationLoading(true);
    const rows = await mockApi.getRecentNotifications(role, 8);
    setRecentNotifications(rows);
    setNotificationLoading(false);
  };

  useEffect(() => {
    void loadUnreadCount();
  }, [role, location.pathname]);

  useEffect(() => {
    const handleNotificationChanged = () => {
      void loadUnreadCount();
      if (notificationVisible) {
        void loadRecentNotifications();
      }
    };
    window.addEventListener(NOTIFICATION_CHANGE_EVENT, handleNotificationChanged);
    return () => window.removeEventListener(NOTIFICATION_CHANGE_EVENT, handleNotificationChanged);
  }, [notificationVisible, role]);

  const openNotificationDrawer = async () => {
    setNotificationVisible(true);
    await Promise.all([loadUnreadCount(), loadRecentNotifications()]);
  };

  const handleNotificationClick = async (item: NotificationInboxItem) => {
    setNotificationProcessing(true);
    if (!item.read) {
      await mockApi.markNotificationRead(item.id);
    }
    setNotificationProcessing(false);
    setNotificationVisible(false);
    if (item.actionable) {
      navigate(isAgentMirror ? toAgentMirrorActionUrl(item.actionUrl, agentMirrorRole) : item.actionUrl);
    }
  };

  const handleReadAllNotifications = async () => {
    setNotificationProcessing(true);
    await mockApi.markAllNotificationsRead(role);
    setNotificationProcessing(false);
    await Promise.all([loadUnreadCount(), loadRecentNotifications()]);
  };

  const handleLogout = () => {
    setNotificationVisible(false);
    navigate('/login');
  };

  const handleUpdatePassword = async () => {
    await mockApi.updateSalesPassword();
    Message.success('密码已更新');
  };

  const forceOpenBranch = (item: NavItem) =>
    (role === 'deliveryAdmin' && item.path === '/ops-admin/orders') ||
    (role === 'deliveryOps' && item.path === '/ops/orders');

  const renderNavItem = (item: NavItem) => {
    const isActive = activeNav(item.path);
    const hasChildren = Boolean(item.children?.length);
    const alwaysOpen = forceOpenBranch(item);
    const branchOpen = alwaysOpen || (openBranches[item.path] ?? isActive);

    if (hasChildren) {
      return (
        <div
          className={`side-menu-branch ${branchOpen ? 'side-menu-branch--open' : ''} ${isActive ? 'side-menu-branch--active' : ''}`}
          key={item.path}
        >
          <div className={`side-menu-item side-menu-item--branch ${isActive ? 'side-menu-item--active' : ''}`}>
            <button
              className="side-menu-item__main"
              type="button"
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              {item.icon ? <span className="side-menu-icon">{item.icon}</span> : null}
              <span className="side-menu-label">{item.label}</span>
            </button>
            {navCollapsed || alwaysOpen ? null : (
              <button
                className="side-menu-expand"
                type="button"
                aria-label={branchOpen ? `收起${item.label}` : `展开${item.label}`}
                onClick={() => setOpenBranches((current) => ({ ...current, [item.path]: !branchOpen }))}
              >
                <IconDown />
              </button>
            )}
          </div>
          {navCollapsed || !branchOpen ? null : (
            <div className="side-submenu">
              {item.children?.map((child) => {
                const childActive = activeNav(child.path);
                return (
                  <button
                    className={`side-menu-item side-menu-item--sub ${child.indent ? 'side-menu-item--indent' : ''} ${
                      childActive ? 'side-menu-item--active' : ''
                    }`}
                    key={child.path}
                    title={child.label}
                    type="button"
                    onClick={() => navigate(child.path)}
                  >
                    <span className="side-menu-label">{child.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        className={`side-menu-item ${item.indent ? 'side-menu-item--indent' : ''} ${
          isActive ? 'side-menu-item--active' : ''
        }`}
        key={item.path}
        title={item.label}
        type="button"
        onClick={() => navigate(item.path)}
      >
        {item.icon ? <span className="side-menu-icon">{item.icon}</span> : null}
        {!item.icon && navCollapsed ? <span className="side-menu-icon side-menu-icon--fallback">{item.label.slice(0, 1)}</span> : null}
        <span className="side-menu-label">{item.label}</span>
      </button>
    );
  };

  return (
    <Layout className={`app-shell app-shell--${layoutMode}`} style={shellStyle}>
      {isFullscreenRoute || isFocusRoute ? null : <Header className="topbar">
        <Button
          className="topbar-menu-button"
          icon={navCollapsed ? <IconMenuUnfold /> : <IconMenuFold />}
          type="text"
          aria-label={navCollapsed ? '展开侧边栏' : '收起侧边栏'}
          onClick={() => setNavCollapsed((value) => !value)}
        />
        <button className="brand-lockup" onClick={() => navigate(isAgentMirror ? '/agent/admin' : '/tenant/overview')} type="button">
          <div className="brand-mark">A</div>
          <div className="brand-title">{brandTitle}</div>
        </button>
        {isAgentMirror ? (
          <Select
            value={agentMirrorRole}
            className="role-select"
            bordered={false}
            onChange={(value) => {
              navigate(agentMirrorRoleRoutes[value as AgentMirrorRole]);
            }}
          >
            <Select.Option value="agentAdmin">{agentMirrorRoleLabels.agentAdmin}</Select.Option>
            <Select.Option value="agentSales">{agentMirrorRoleLabels.agentSales}</Select.Option>
            <Select.Option value="agentFinance">{agentMirrorRoleLabels.agentFinance}</Select.Option>
          </Select>
        ) : (
          <Select
            value={roleSelectValue}
            className="role-select"
            bordered={false}
            onChange={(value) => {
              navigate(roleRoutes[value as RoleKey]);
            }}
          >
            <Select.Option value="tenantAdmin">客户管理员</Select.Option>
            <Select.Option value="salesAdmin">销售管理员</Select.Option>
            <Select.Option value="sales">销售</Select.Option>
            <Select.Option value="deliveryAdmin">交付管理员</Select.Option>
            <Select.Option value="deliveryOps">交付运维</Select.Option>
            <Select.Option value="platformAdmin">超级管理员</Select.Option>
            <Select.Option value="finance">财务</Select.Option>
          </Select>
        )}
        <div className="topbar-divider" />
        <div className="topbar__spacer" />
        <Space size={14} className="topbar__actions">
          {showMiniProgramEntry ? (
            <Button
              className="topbar-link-button"
              type="text"
              onClick={() => setMiniProgramGuideVisible(true)}
            >
              小程序端
            </Button>
          ) : null}
          <Button
            className="topbar-link-button"
            type="text"
            onClick={() => setTenantGuideVisible(true)}
          >
            使用指引
          </Button>
          <Button
            className="topbar-link-button"
            type="text"
            onClick={() => setTenantDocsVisible(true)}
          >
            文档
          </Button>
          <Badge count={unreadCount > 99 ? '99+' : unreadCount || undefined} dot={unreadCount > 0}>
            <Button
              className="top-icon-button"
              icon={<IconNotification />}
              shape="circle"
              type="text"
              onClick={() => {
                void openNotificationDrawer();
              }}
            />
          </Badge>
          <Dropdown
            position="br"
            droplist={(
              <Menu>
                {role === 'sales' && (
                  <Menu.Item key="password" onClick={handleUpdatePassword}>
                    修改密码
                  </Menu.Item>
                )}
                <Menu.Item key="logout" onClick={handleLogout}>
                  Log out
                </Menu.Item>
              </Menu>
            )}
          >
            <button className="topbar-avatar-button" type="button" aria-label="账户菜单">
              <Avatar size={30}>云</Avatar>
            </button>
          </Dropdown>
        </Space>
      </Header>}
      <Drawer
        className="notification-drawer"
        width={420}
        title="通知"
        visible={notificationVisible}
        onCancel={() => setNotificationVisible(false)}
        footer={null}
      >
        <div className="notification-drawer__toolbar">
          <Text type="secondary">最近通知</Text>
          <Button size="small" loading={notificationProcessing} onClick={() => { void handleReadAllNotifications(); }}>
            全部已读
          </Button>
        </div>
        {notificationLoading ? (
          <Spin className="page-spin" tip="加载通知中" />
        ) : recentNotifications.length ? (
          <div className="notification-feed notification-feed--drawer">
            {recentNotifications.map((item) => (
              <article key={item.id} className={`notification-card ${item.read ? '' : 'is-unread'}`}>
                <div className="notification-card__head">
                  <Space size={8}>
                    <Tag color={notificationCategoryMeta[item.category].color}>
                      {notificationCategoryMeta[item.category].text}
                    </Tag>
                    {item.todo ? <Tag color="red">待处理</Tag> : null}
                    {!item.read ? <Tag color="arcoblue">未读</Tag> : null}
                  </Space>
                </div>
                <div className="notification-card__body">
                  <div className="notification-card__title">{item.title}</div>
                  <div className="notification-card__summary">{item.summary}</div>
                </div>
                <div className="notification-card__foot">
                  <Text type="secondary">{item.createdAt}</Text>
                  <Button
                    size="small"
                    type={item.read ? 'outline' : 'primary'}
                    disabled={notificationProcessing || !item.actionable}
                    onClick={() => {
                      void handleNotificationClick(item);
                    }}
                  >
                    {item.actionLabel}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty description="暂无通知" />
        )}
        <div className="notification-drawer__footer">
          <Button
            long
            type="outline"
            onClick={() => {
              setNotificationVisible(false);
              navigate(notificationListRoute);
            }}
          >
            查看全部
          </Button>
        </div>
      </Drawer>
      <Modal
        className="tenant-help-modal"
        title="使用指引"
        visible={tenantGuideVisible}
        footer={null}
        onCancel={() => setTenantGuideVisible(false)}
      >
        <TenantGuideModalContent />
      </Modal>
      <Modal
        className="tenant-help-modal"
        title="文档"
        visible={tenantDocsVisible}
        footer={null}
        onCancel={() => setTenantDocsVisible(false)}
      >
        <TenantDocsModalContent />
      </Modal>
      <Modal
        className="tenant-help-modal"
        title="小程序端"
        visible={miniProgramGuideVisible}
        footer={null}
        onCancel={() => setMiniProgramGuideVisible(false)}
      >
        <Space direction="vertical" size={12}>
          <Text>当前移动端已改为 UniApp 微信小程序 mock，不再通过浏览器 H5 地址打开。</Text>
          <Text>项目目录：frontend-miniapp</Text>
          <Text>启动命令：npm run dev:mp-weixin</Text>
          <Text>微信开发者工具导入目录：frontend-miniapp/dist/dev/mp-weixin</Text>
          <Text>当前身份页面：{miniProgramPage}</Text>
        </Space>
      </Modal>
      <Layout>
        {hideSideNav ? null : (
          <Sider className={`side-nav ${navCollapsed ? 'side-nav--collapsed' : ''}`} width={200} collapsed={navCollapsed} collapsedWidth={60}>
            <div className="side-product">{navCollapsed ? 'A' : sideProduct}</div>
            <div className="side-menu">
              {navGroups.map((group) => (
                <div className="side-group" key={group.title || 'main'}>
                  {group.title ? <div className="side-group-title">{group.title}</div> : null}
                  {group.items.map(renderNavItem)}
                </div>
              ))}
            </div>
          </Sider>
        )}
        <Content className={`workspace workspace--${layoutMode}`}>
          <div className={`workspace__inner workspace__inner--${layoutMode}`}>
            {showBreadcrumb ? (
              <div className="breadcrumb">
                <Text>{routeMeta?.pageName ?? '建设中'}</Text>
              </div>
            ) : null}
            <Outlet />
          </div>
          {isFullscreenRoute ? null : isFocusRoute ? (
            <div className="floating-help floating-help--purchase">
              <Button aria-label="智能助手" icon={<IconRobot />} shape="circle" title="智能助手" />
              <Button aria-label="在线客服" icon={<IconCustomerService />} shape="circle" title="在线客服" />
              <Button aria-label="帮助文档" icon={<IconQuestionCircle />} shape="circle" title="帮助文档" />
            </div>
          ) : <div className="floating-help">
            <Button aria-label="智能助手" icon={<IconRobot />} shape="circle" title="智能助手" />
            <Button aria-label="在线客服" icon={<IconCustomerService />} shape="circle" title="在线客服" />
            <Button aria-label="帮助文档" icon={<IconQuestionCircle />} shape="circle" title="帮助文档" />
          </div>}
        </Content>
      </Layout>
    </Layout>
  );
}
