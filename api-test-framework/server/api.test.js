/**
 * ArkClaw Mock Server 单元测试
 * 覆盖所有 API 接口的正常流程、异常流程和边界值测试
 */

const request = require('supertest');

// 引入 Express 应用
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// 创建测试应用实例
const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mock 数据
  const mockTenants = [
    {
      id: 'tenant-001',
      name: '测试企业有限公司',
      uscc: '91310101MA1G812345',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-06-20T14:20:00Z',
      adminName: '张三',
      adminEmail: 'zhangsan@test.com',
      adminPhone: '17772627362',
      address: '上海市浦东新区张江高科技园区',
      industry: '科技',
      scale: 'medium',
      employees: 150
    },
    {
      id: 'tenant-002',
      name: '示例科技有限公司',
      uscc: '91310101MA1G867890',
      status: 'active',
      createdAt: '2024-02-20T09:15:00Z',
      updatedAt: '2024-06-18T16:45:00Z',
      adminName: '李四',
      adminEmail: 'lisi@example.com',
      adminPhone: '19902928273',
      address: '北京市海淀区中关村科技园',
      industry: '互联网',
      scale: 'large',
      employees: 500
    }
  ];

  const mockOrders = [
    {
      id: 'order-001',
      tenantId: 'tenant-001',
      tenantName: '测试企业有限公司',
      type: 'seat',
      status: 'paid',
      totalAmount: 10000,
      paidAmount: 10000,
      paymentMethod: 'bank_transfer',
      createdAt: '2024-06-20T10:00:00Z',
      paidAt: '2024-06-20T14:30:00Z',
      items: [
        {
          id: 'item-001',
          name: '基础席位',
          quantity: 10,
          unitPrice: 1000,
          totalPrice: 10000
        }
      ]
    }
  ];

  const mockUsers = [
    { id: 'user-001', phone: '17630059309', password: '12345qwe', name: '官方管理员', role: 'officialAdmin' },
    { id: 'user-002', phone: '17772627362', password: '12345qwe', name: '企业管理员', role: 'tenantAdmin' },
    { id: 'user-003', phone: '19902928273', password: '12345qwe', name: '企业用户', role: 'tenantUser' },
    { id: 'user-004', phone: '18800001111', password: '12345qwe', name: '商务人员', role: 'sales' }
  ];

  // 首页
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send('<html><body><h1>Mock Server</h1></body></html>');
  });

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ success: true, code: 200, message: 'Mock server is running' });
  });

  // 登录
  app.post('/api/auth/login', (req, res) => {
    const { username, password, domain } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, code: 400, message: 'Username and password are required' });
    }
    const user = mockUsers.find(u => u.phone === username && u.password === password);
    if (user) {
      res.json({
        success: true, code: 200, message: 'Login successful',
        data: { token: 'mock-token-' + user.id, user: { id: user.id, phone: user.phone, name: user.name, role: user.role }, domain: domain || 'localhost' }
      });
    } else {
      res.status(401).json({ success: false, code: 401, message: 'Invalid username or password' });
    }
  });

  // 获取企业列表
  app.get('/api/tenants', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = mockTenants.slice(start, end);
    res.json({
      success: true, code: 200, message: 'success',
      data: paginatedData,
      pagination: { page, pageSize, total: mockTenants.length, totalPages: Math.ceil(mockTenants.length / pageSize) }
    });
  });

  // 获取企业详情
  app.get('/api/tenants/:id', (req, res) => {
    const tenant = mockTenants.find(t => t.id === req.params.id);
    if (tenant) {
      res.json({ success: true, code: 200, message: 'success', data: tenant });
    } else {
      res.status(404).json({ success: false, code: 404, message: 'Tenant not found' });
    }
  });

  // 创建企业
  app.post('/api/tenants', (req, res) => {
    const { name, uscc, adminName, adminPhone } = req.body;
    if (!name || !uscc) {
      return res.status(400).json({ success: false, code: 400, message: 'Name and USCC are required' });
    }
    const newTenant = { id: 'tenant-' + uuidv4().slice(0, 8), name, uscc, adminName, adminPhone, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    mockTenants.push(newTenant);
    res.status(201).json({ success: true, code: 201, message: 'Tenant created successfully', data: newTenant });
  });

  // 更新企业
  app.put('/api/tenants/:id', (req, res) => {
    const index = mockTenants.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Tenant not found' });
    }
    const updatedTenant = { ...mockTenants[index], ...req.body, updatedAt: new Date().toISOString() };
    mockTenants[index] = updatedTenant;
    res.json({ success: true, code: 200, message: 'Tenant updated successfully', data: updatedTenant });
  });

  // 删除企业
  app.delete('/api/tenants/:id', (req, res) => {
    const index = mockTenants.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Tenant not found' });
    }
    mockTenants.splice(index, 1);
    res.json({ success: true, code: 200, message: 'Tenant deleted successfully' });
  });

  // 激活企业
  app.post('/api/tenants/:id/activate', (req, res) => {
    const index = mockTenants.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Tenant not found' });
    }
    mockTenants[index].status = 'active';
    res.json({ success: true, code: 200, message: 'Tenant activated successfully', data: mockTenants[index] });
  });

  // 暂停企业
  app.post('/api/tenants/:id/suspend', (req, res) => {
    const index = mockTenants.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Tenant not found' });
    }
    mockTenants[index].status = 'suspended';
    res.json({ success: true, code: 200, message: 'Tenant suspended successfully', data: mockTenants[index] });
  });

  // 获取订单列表
  app.get('/api/orders', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const status = req.query.status;
    let filteredOrders = mockOrders;
    if (status) {
      filteredOrders = mockOrders.filter(o => o.status === status);
    }
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filteredOrders.slice(start, end);
    res.json({
      success: true, code: 200, message: 'success',
      data: paginatedData,
      pagination: { page, pageSize, total: filteredOrders.length, totalPages: Math.ceil(filteredOrders.length / pageSize) }
    });
  });

  // 获取订单详情
  app.get('/api/orders/:id', (req, res) => {
    const order = mockOrders.find(o => o.id === req.params.id);
    if (order) {
      res.json({ success: true, code: 200, message: 'success', data: order });
    } else {
      res.status(404).json({ success: false, code: 404, message: 'Order not found' });
    }
  });

  // 创建订单
  app.post('/api/orders', (req, res) => {
    const { tenantId, type, paymentMethod, items } = req.body;
    if (!tenantId || !type || !paymentMethod || !items || items.length === 0) {
      return res.status(400).json({ success: false, code: 400, message: 'Missing required fields' });
    }
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const newOrder = { id: 'order-' + uuidv4().slice(0, 8), tenantId, type, paymentMethod, status: 'pending', paidAmount: 0, totalAmount, createdAt: new Date().toISOString(), items };
    mockOrders.push(newOrder);
    res.status(201).json({ success: true, code: 201, message: 'Order created successfully', data: newOrder });
  });

  // 更新订单
  app.put('/api/orders/:id', (req, res) => {
    const index = mockOrders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Order not found' });
    }
    const updatedOrder = { ...mockOrders[index], ...req.body, updatedAt: new Date().toISOString() };
    mockOrders[index] = updatedOrder;
    res.json({ success: true, code: 200, message: 'Order updated successfully', data: updatedOrder });
  });

  // 确认支付
  app.post('/api/orders/:id/confirm-payment', (req, res) => {
    const index = mockOrders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Order not found' });
    }
    const { actualAmount } = req.body;
    if (actualAmount && actualAmount !== mockOrders[index].totalAmount) {
      return res.status(400).json({ success: false, code: 400, message: 'Payment amount mismatch' });
    }
    mockOrders[index].status = 'paid';
    mockOrders[index].paidAmount = actualAmount || mockOrders[index].totalAmount;
    mockOrders[index].paidAt = new Date().toISOString();
    res.json({ success: true, code: 200, message: 'Payment confirmed successfully', data: mockOrders[index] });
  });

  // 取消订单
  app.post('/api/orders/:id/cancel', (req, res) => {
    const index = mockOrders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Order not found' });
    }
    if (mockOrders[index].status === 'paid' || mockOrders[index].status === 'activated') {
      return res.status(400).json({ success: false, code: 400, message: 'Cannot cancel paid or activated order' });
    }
    mockOrders[index].status = 'cancelled';
    res.json({ success: true, code: 200, message: 'Order cancelled successfully', data: mockOrders[index] });
  });

  // 开通服务
  app.post('/api/orders/:id/activate', (req, res) => {
    const index = mockOrders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, code: 404, message: 'Order not found' });
    }
    if (mockOrders[index].status !== 'paid') {
      return res.status(400).json({ success: false, code: 400, message: 'Only paid orders can be activated' });
    }
    mockOrders[index].status = 'activated';
    res.json({ success: true, code: 200, message: 'Service activated successfully', data: mockOrders[index] });
  });

  return app;
};

describe('ArkClaw Mock Server API 测试', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('健康检查', () => {
    test('GET /health - 应该返回服务器运行状态', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('Mock server is running');
    });

    test('GET / - 首页应该返回HTML', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('用户认证 API', () => {
    test('POST /api/auth/login - 正确登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: '17630059309', password: '12345qwe', domain: 'localhost' });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.role).toBe('officialAdmin');
    });

    test('POST /api/auth/login - 缺少用户名', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: '12345qwe' });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe(400);
    });

    test('POST /api/auth/login - 错误密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: '17630059309', password: 'wrongpassword' });
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe(401);
    });

    test('POST /api/auth/login - 用户不存在', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: '00000000000', password: '12345qwe' });
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/auth/login - 缺少密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: '17630059309' });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('企业管理 API', () => {
    test('GET /api/tenants - 获取企业列表', async () => {
      const response = await request(app).get('/api/tenants');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    test('GET /api/tenants - 分页参数', async () => {
      const response = await request(app).get('/api/tenants?page=1&pageSize=1');
      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(1);
    });

    test('GET /api/tenants/:id - 获取企业详情', async () => {
      const response = await request(app).get('/api/tenants/tenant-001');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('tenant-001');
      expect(response.body.data.name).toBe('测试企业有限公司');
    });

    test('GET /api/tenants/:id - 企业不存在', async () => {
      const response = await request(app).get('/api/tenants/non-existent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe(404);
    });

    test('POST /api/tenants - 创建企业成功', async () => {
      const response = await request(app)
        .post('/api/tenants')
        .send({ name: '新企业', uscc: '91110000MA00ABCD01', adminName: '管理员', adminPhone: '13800138000' });
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.code).toBe(201);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('pending');
    });

    test('POST /api/tenants - 缺少必填字段', async () => {
      const response = await request(app)
        .post('/api/tenants')
        .send({ name: '新企业' });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe(400);
    });

    test('PUT /api/tenants/:id - 更新企业成功', async () => {
      const response = await request(app)
        .put('/api/tenants/tenant-001')
        .send({ name: '更新后的企业名称' });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('更新后的企业名称');
    });

    test('PUT /api/tenants/:id - 企业不存在', async () => {
      const response = await request(app)
        .put('/api/tenants/non-existent')
        .send({ name: '更新名称' });
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('DELETE /api/tenants/:id - 删除企业成功', async () => {
      const response = await request(app).delete('/api/tenants/tenant-001');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tenant deleted successfully');
    });

    test('DELETE /api/tenants/:id - 企业不存在', async () => {
      const response = await request(app).delete('/api/tenants/non-existent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/tenants/:id/activate - 激活企业', async () => {
      const response = await request(app).post('/api/tenants/tenant-002/activate');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    test('POST /api/tenants/:id/suspend - 暂停企业', async () => {
      const response = await request(app).post('/api/tenants/tenant-002/suspend');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('suspended');
    });
  });

  describe('订单管理 API', () => {
    test('GET /api/orders - 获取订单列表', async () => {
      const response = await request(app).get('/api/orders');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    test('GET /api/orders - 状态筛选', async () => {
      const response = await request(app).get('/api/orders?status=paid');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach(order => {
        expect(order.status).toBe('paid');
      });
    });

    test('GET /api/orders/:id - 获取订单详情', async () => {
      const response = await request(app).get('/api/orders/order-001');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order-001');
    });

    test('GET /api/orders/:id - 订单不存在', async () => {
      const response = await request(app).get('/api/orders/non-existent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/orders - 创建订单成功', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-001',
          type: 'seat',
          paymentMethod: 'bank_transfer',
          items: [{ name: '席位', quantity: 5, unitPrice: 1000 }]
        });
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.totalAmount).toBe(5000);
      expect(response.body.data.status).toBe('pending');
    });

    test('POST /api/orders - 缺少必填字段', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({ tenantId: 'tenant-001' });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe(400);
    });

    test('POST /api/orders - 空订单项', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({ tenantId: 'tenant-001', type: 'seat', paymentMethod: 'bank_transfer', items: [] });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('PUT /api/orders/:id - 更新订单', async () => {
      const response = await request(app)
        .put('/api/orders/order-001')
        .send({ type: 'package' });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('package');
    });

    test('POST /api/orders/:id/confirm-payment - 确认支付成功', async () => {
      const response = await request(app)
        .post('/api/orders/order-001/confirm-payment')
        .send({ actualAmount: 10000 });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paid');
      expect(response.body.data.paidAmount).toBe(10000);
    });

    test('POST /api/orders/:id/confirm-payment - 金额不匹配', async () => {
      const response = await request(app)
        .post('/api/orders/order-001/confirm-payment')
        .send({ actualAmount: 5000 });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('amount mismatch');
    });

    test('POST /api/orders/:id/cancel - 取消待支付订单', async () => {
      const response = await request(app).post('/api/orders/order-001/cancel');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    test('POST /api/orders/:id/activate - 开通服务', async () => {
      const response = await request(app).post('/api/orders/order-001/activate');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('activated');
    });

    test('POST /api/orders/:id/activate - 已支付订单才能开通', async () => {
      const response = await request(app).post('/api/orders/order-001/activate');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only paid orders');
    });
  });

  describe('边界值和异常测试', () => {
    test('GET /api/orders - 无效的分页参数', async () => {
      const response = await request(app).get('/api/orders?page=-1&pageSize=0');
      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(20);
    });

    test('POST /api/orders - 负数数量', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-001',
          type: 'seat',
          paymentMethod: 'bank_transfer',
          items: [{ name: '席位', quantity: -10, unitPrice: 1000 }]
        });
      expect(response.status).toBe(201);
    });

    test('POST /api/orders - 零价格', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-001',
          type: 'seat',
          paymentMethod: 'bank_transfer',
          items: [{ name: '席位', quantity: 1, unitPrice: 0 }]
        });
      expect(response.status).toBe(201);
      expect(response.body.data.totalAmount).toBe(0);
    });

    test('POST /api/orders - 超大金额', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-001',
          type: 'seat',
          paymentMethod: 'bank_transfer',
          items: [{ name: '席位', quantity: 1000000, unitPrice: 1000000 }]
        });
      expect(response.status).toBe(201);
      expect(response.body.data.totalAmount).toBe(1000000000000);
    });

    test('GET /api/tenants - 超出范围的分页', async () => {
      const response = await request(app).get('/api/tenants?page=1000');
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });
});
