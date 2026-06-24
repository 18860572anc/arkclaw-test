const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

const SITES = {
  mirror1: 'https://claw-test-mirror.brainlink.cloud',    // 镜像站1
  mirror2: 'https://claw-test-mirror2.brainlink.cloud'   // 镜像站2
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

const mockTenants = [
  { id: 'tenant-001', name: '测试企业', uscc: '91310101MA1G812345', status: 'active', adminPhone: '17772627362' },
  { id: 'tenant-002', name: '示例科技', uscc: '91310101MA1G867890', status: 'active', adminPhone: '19902928273' },
  { id: 'tenant-003', name: '演示企业', uscc: '91310101MA1G855555', status: 'pending', adminPhone: '18888888888' }
];

const mockOrders = [
  { id: 'order-001', tenantId: 'tenant-001', type: 'seat', status: 'paid', totalAmount: 10000 },
  { id: 'order-002', tenantId: 'tenant-002', type: 'package', status: 'confirmed', totalAmount: 50000 },
  { id: 'order-003', tenantId: 'tenant-001', type: 'seat', status: 'pending', totalAmount: 5000 }
];

const mockUsers = [
  { phone: '17630059309', password: '12345qwe', role: 'officialAdmin', name: '官方管理员' },
  { phone: '17726625243', password: '12345qwe', role: 'business', name: '商务人员' },
  { phone: '17772627362', password: '12345qwe', role: 'tenantAdmin', name: '企业客户管理员' },
  { phone: '19902928273', password: '12345qwe', role: 'tenantAdmin', name: '镜像站客户管理员' }
];

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = mockUsers.find(u => u.phone === username && u.password === password);
  if (user) {
    res.json({ success: true, code: 200, data: { token: 'mock-token-' + Date.now(), user } });
  } else {
    res.status(401).json({ success: false, code: 401, message: '用户名或密码错误' });
  }
});

app.get('/api/tenants', (req, res) => res.json({ success: true, code: 200, data: mockTenants }));
app.get('/api/tenants/:id', (req, res) => {
  const tenant = mockTenants.find(t => t.id === req.params.id);
  tenant ? res.json({ success: true, code: 200, data: tenant }) : res.status(404).json({ success: false, code: 404 });
});
app.post('/api/tenants', (req, res) => {
  const newTenant = { id: 'tenant-' + uuidv4().slice(0, 8), ...req.body, status: 'pending' };
  mockTenants.push(newTenant);
  res.status(201).json({ success: true, code: 201, data: newTenant });
});

app.get('/api/orders', (req, res) => res.json({ success: true, code: 200, data: mockOrders }));
app.get('/api/orders/:id', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  order ? res.json({ success: true, code: 200, data: order }) : res.status(404).json({ success: false, code: 404 });
});
app.post('/api/orders', (req, res) => {
  const newOrder = { id: 'order-' + uuidv4().slice(0, 8), ...req.body, status: 'pending' };
  mockOrders.push(newOrder);
  res.status(201).json({ success: true, code: 201, data: newOrder });
});
app.post('/api/orders/:id/confirm-payment', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order) {
    order.status = 'confirmed';
    res.json({ success: true, code: 200, data: order });
  } else {
    res.status(404).json({ success: false, code: 404 });
  }
});
app.post('/api/orders/:id/activate', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order && order.status === 'confirmed') {
    order.status = 'activated';
    res.json({ success: true, code: 200, data: order });
  } else {
    res.status(400).json({ success: false, code: 400 });
  }
});

// 订单支付接口
app.post('/api/orders/:id/pay', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order) {
    order.status = 'paid';
    order.paymentMethod = req.body.paymentMethod;
    order.actualAmount = req.body.amount;
    res.json({ success: true, code: 200, data: order });
  } else {
    res.status(404).json({ success: false, code: 404 });
  }
});

// 订单审核接口（交付运维初步审核）
app.post('/api/orders/:id/review', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order && order.status === 'paid') {
    order.status = 'reviewed';
    order.reviewResult = req.body.reviewResult;
    res.json({ success: true, code: 200, data: order });
  } else {
    res.status(400).json({ success: false, code: 400 });
  }
});

// 订单确认接口（财务人员确认）
app.post('/api/orders/:id/confirm', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order && order.status === 'reviewed') {
    order.status = 'confirmed';
    order.confirmResult = req.body.confirmResult;
    res.json({ success: true, code: 200, data: order });
  } else {
    res.status(400).json({ success: false, code: 400 });
  }
});

// 订单采购接口（官方管理员采购）
app.post('/api/orders/:id/purchase', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order) {
    order.status = 'purchased';
    order.purchaseResult = req.body.purchaseResult;
    res.json({ success: true, code: 200, data: order });
  } else {
    res.status(404).json({ success: false, code: 404 });
  }
});

// 订单审核接口（镜像站财务审核）
app.post('/api/orders/:id/audit', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order) {
    order.status = 'audited';
    order.auditResult = req.body.auditResult;
    res.json({ success: true, code: 200, data: order });
  } else {
    res.status(404).json({ success: false, code: 404 });
  }
});

// 佣金查询接口
app.post('/api/commissions', (req, res) => {
  const mockCommissions = [
    { id: 'comm-001', businessId: 'business-001', amount: 5000, status: 'pending' },
    { id: 'comm-002', businessId: 'business-001', amount: 3000, status: 'settled' }
  ];
  res.json({ success: true, code: 200, data: mockCommissions });
});

// 佣金结算接口
app.post('/api/commissions/:id/settle', (req, res) => {
  res.json({ 
    success: true, 
    code: 200, 
    data: { 
      id: req.params.id, 
      settleAmount: req.body.settleAmount, 
      status: 'settled',
      settleTime: new Date().toISOString()
    } 
  });
});

// 佣金申请接口
app.post('/api/commissions/:id/apply', (req, res) => {
  res.json({ 
    success: true, 
    code: 200, 
    data: { 
      id: req.params.id, 
      applyAmount: req.body.applyAmount, 
      status: 'applied',
      applyTime: new Date().toISOString()
    } 
  });
});

// 佣金发放接口（财务发放）
app.post('/api/commissions/:id/pay', (req, res) => {
  res.json({ 
    success: true, 
    code: 200, 
    data: { 
      id: req.params.id, 
      payAmount: req.body.payAmount, 
      status: 'paid',
      payTime: new Date().toISOString()
    } 
  });
});

// 员工管理接口
app.post('/api/employees', (req, res) => {
  const newEmployee = { id: 'emp-' + uuidv4().slice(0, 8), ...req.body, status: 'active' };
  res.status(201).json({ success: true, code: 201, data: newEmployee });
});

app.put('/api/employees/:id', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, ...req.body } });
});

app.post('/api/employees/:id/set-admin', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, isAdmin: req.body.isAdmin } });
});

// 优惠券接口
app.post('/api/coupons/template', (req, res) => {
  const newTemplate = { id: 'template-' + uuidv4().slice(0, 8), ...req.body };
  res.status(201).json({ success: true, code: 201, data: newTemplate });
});

app.post('/api/coupons/:id/issue', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, ...req.body, issued: true } });
});

app.post('/api/coupons/receive', (req, res) => {
  res.json({ success: true, code: 200, data: { couponId: req.body.couponId, userId: req.body.userId, received: true } });
});

// 银行账户接口
app.post('/api/bank-account', (req, res) => {
  res.json({ success: true, code: 200, data: { ...req.body, saved: true } });
});

// 发票接口
app.post('/api/invoices', (req, res) => {
  const newInvoice = { id: 'invoice-' + uuidv4().slice(0, 8), ...req.body, status: 'pending' };
  res.status(201).json({ success: true, code: 201, data: newInvoice });
});

app.post('/api/invoices/:id/issue', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, ...req.body } });
});

// 工单接口
app.post('/api/tickets', (req, res) => {
  const newTicket = { id: 'ticket-' + uuidv4().slice(0, 8), ...req.body, status: 'pending' };
  res.status(201).json({ success: true, code: 201, data: newTicket });
});

app.post('/api/tickets/all', (req, res) => {
  const mockTickets = [
    { id: 'ticket-001', type: 'seat_package', title: '咨询席位套餐', status: 'pending' },
    { id: 'ticket-002', type: 'activation', title: '服务开通', status: 'assigned' },
    { id: 'ticket-003', type: 'tech_support', title: '技术支持', status: 'resolved' }
  ];
  res.json({ success: true, code: 200, data: mockTickets });
});

app.post('/api/tickets/:id/assign', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, assigneeId: req.body.assigneeId, status: 'assigned' } });
});

app.post('/api/tickets/:id/review', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, reviewResult: req.body.reviewResult, status: 'reviewed' } });
});

app.post('/api/tickets/:id/forward', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, targetRole: req.body.targetRole, status: 'forwarded' } });
});

app.post('/api/tickets/:id/resolve', (req, res) => {
  res.json({ success: true, code: 200, data: { id: req.params.id, resolution: req.body.resolution, status: 'resolved' } });
});

// 订单总览接口（外部代理镜像站官方管理员）
app.post('/api/orders/overview', (req, res) => {
  const overview = {
    totalOrders: 100,
    pendingOrders: 20,
    auditedOrders: 50,
    purchasedOrders: 30
  };
  res.json({ success: true, code: 200, data: overview });
});

// 待采购订单列表接口
app.post('/api/orders/pending', (req, res) => {
  const pendingOrders = [
    { id: 'order-005', tenantName: '测试企业A', totalAmount: 50000, status: 'audited' },
    { id: 'order-006', tenantName: '测试企业B', totalAmount: 30000, status: 'audited' }
  ];
  res.json({ success: true, code: 200, data: pendingOrders });
});

// 多站点代理 API
app.all('/proxy/:site/*', async (req, res) => {
  try {
    const { site } = req.params;
    const baseUrl = SITES[site];
    
    if (!baseUrl) {
      return res.status(400).json({ success: false, code: 400, message: '无效的站点标识' });
    }
    
    const path = req.path.replace(`/proxy/${site}`, '');
    const url = baseUrl + path;
    
    const response = await axios({
      method: req.method,
      url: url,
      headers: { ...req.headers, host: new URL(baseUrl).host },
      data: req.body,
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('代理请求失败:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    });
  }
});

// 获取站点列表
app.get('/api/sites', (req, res) => {
  res.json({ success: true, code: 200, data: SITES });
});

app.get('/health', (req, res) => res.json({ success: true, code: 200, message: '主站接口测试平台运行中' }));

app.get('/', (req, res) => {
  const frontendPath = path.join(__dirname, 'frontend.html');
  if (fs.existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.send('<h1>主站接口测试平台</h1><p>请访问 /health 检查服务状态</p>');
  }
});

app.listen(PORT, () => {
  console.log(`主站接口测试平台运行在 http://localhost:${PORT}`);
  console.log('支持的站点:');
  console.log('  - mirror1:', SITES.mirror1);
  console.log('  - mirror2:', SITES.mirror2);
});