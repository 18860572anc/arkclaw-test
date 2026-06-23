const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock data
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
  },
  {
    id: 'tenant-003',
    name: '演示企业股份有限公司',
    uscc: '91310101MA1G855555',
    status: 'pending',
    createdAt: '2024-06-22T08:00:00Z',
    updatedAt: '2024-06-22T08:00:00Z',
    adminName: '王五',
    adminEmail: 'wangwu@demo.com',
    adminPhone: '18888888888',
    address: '广东省深圳市南山区科技园',
    industry: '金融',
    scale: 'small',
    employees: 50
  }
];

const mockOrders = [
  {
    id: 'order-001',
    tenantId: 'tenant-001',
    tenantName: '测试企业有限公司',
    type: 'seat',
    status: 'paid',
    totalAmount: 10000.00,
    paidAmount: 10000.00,
    paymentMethod: 'bank_transfer',
    createdAt: '2024-06-20T10:00:00Z',
    paidAt: '2024-06-20T14:30:00Z',
    items: [
      { id: 'item-001', name: '基础席位', quantity: 10, unitPrice: 1000.00, totalPrice: 10000.00 }
    ]
  },
  {
    id: 'order-002',
    tenantId: 'tenant-002',
    tenantName: '示例科技有限公司',
    type: 'package',
    status: 'confirmed',
    totalAmount: 50000.00,
    paidAmount: 50000.00,
    paymentMethod: 'alipay',
    createdAt: '2024-06-19T11:30:00Z',
    paidAt: '2024-06-19T11:35:00Z',
    confirmedAt: '2024-06-19T15:00:00Z',
    items: [
      { id: 'item-002', name: '高级套餐', quantity: 5, unitPrice: 10000.00, totalPrice: 50000.00 }
    ]
  },
  {
    id: 'order-003',
    tenantId: 'tenant-001',
    tenantName: '测试企业有限公司',
    type: 'seat',
    status: 'pending',
    totalAmount: 5000.00,
    paidAmount: 0,
    paymentMethod: 'wechat',
    createdAt: '2024-06-22T09:00:00Z',
    items: [
      { id: 'item-003', name: '基础席位', quantity: 5, unitPrice: 1000.00, totalPrice: 5000.00 }
    ]
  },
  {
    id: 'order-004',
    tenantId: 'tenant-003',
    tenantName: '演示企业股份有限公司',
    type: 'seat',
    status: 'activated',
    totalAmount: 3000.00,
    paidAmount: 3000.00,
    paymentMethod: 'bank_transfer',
    createdAt: '2024-06-21T10:00:00Z',
    paidAt: '2024-06-21T16:00:00Z',
    confirmedAt: '2024-06-21T17:00:00Z',
    items: [
      { id: 'item-004', name: '基础席位', quantity: 3, unitPrice: 1000.00, totalPrice: 3000.00 }
    ]
  },
  {
    id: 'order-005',
    tenantId: 'tenant-002',
    tenantName: '示例科技有限公司',
    type: 'topup',
    status: 'paid',
    totalAmount: 100000.00,
    paidAmount: 100000.00,
    paymentMethod: 'bank_transfer',
    createdAt: '2024-06-18T09:00:00Z',
    paidAt: '2024-06-18T14:00:00Z',
    items: [
      { id: 'item-005', name: '账户充值', quantity: 1, unitPrice: 100000.00, totalPrice: 100000.00 }
    ]
  }
];

// Mock users for authentication
const mockUsers = [
  { id: 'user-001', phone: '17630059309', password: '12345qwe', role: 'officialAdmin', name: '官方管理员' },
  { id: 'user-002', phone: '17726625243', password: '12345qwe', role: 'business', name: '商务人员' },
  { id: 'user-003', phone: '15035948715', password: '12345qwe', role: 'opsAdmin', name: '交付运维管理员' },
  { id: 'user-004', phone: '15266352635', password: '12345qwe', role: 'ops', name: '交付运维' },
  { id: 'user-005', phone: '18899283726', password: '12345qwe', role: 'finance', name: '财务人员' },
  { id: 'user-006', phone: '17772627362', password: '12345qwe', role: 'tenantAdmin', name: '企业客户管理员' },
  { id: 'user-007', phone: '19902928273', password: '12345qwe', role: 'tenantAdmin', name: '镜像站客户管理员' },
];

// Auth API - Login
app.post('/api/auth/login', (req, res) => {
  const { username, password, domain } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'Username and password are required'
    });
  }
  
  const user = mockUsers.find(u => u.phone === username && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      code: 200,
      message: 'Login successful',
      data: {
        token: 'mock-token-' + user.id + '-' + Date.now(),
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role
        },
        domain: domain || 'localhost'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      code: 401,
      message: 'Invalid username or password'
    });
  }
});

// Tenants API
app.get('/api/tenants', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  const total = mockTenants.length;
  const data = mockTenants.slice(start, end);
  
  res.json({
    success: true,
    code: 200,
    message: 'success',
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
});

app.get('/api/tenants/:id', (req, res) => {
  const tenant = mockTenants.find(t => t.id === req.params.id);
  
  if (tenant) {
    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: tenant
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Tenant not found'
    });
  }
});

app.post('/api/tenants', (req, res) => {
  const newTenant = {
    id: 'tenant-' + uuidv4().slice(0, 8),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockTenants.push(newTenant);
  
  res.status(201).json({
    success: true,
    code: 201,
    message: 'Tenant created successfully',
    data: newTenant
  });
});

app.put('/api/tenants/:id', (req, res) => {
  const index = mockTenants.findIndex(t => t.id === req.params.id);
  
  if (index !== -1) {
    mockTenants[index] = {
      ...mockTenants[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      code: 200,
      message: 'Tenant updated successfully',
      data: mockTenants[index]
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Tenant not found'
    });
  }
});

app.delete('/api/tenants/:id', (req, res) => {
  const index = mockTenants.findIndex(t => t.id === req.params.id);
  
  if (index !== -1) {
    mockTenants.splice(index, 1);
    
    res.json({
      success: true,
      code: 200,
      message: 'Tenant deleted successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Tenant not found'
    });
  }
});

app.post('/api/tenants/:id/activate', (req, res) => {
  const tenant = mockTenants.find(t => t.id === req.params.id);
  
  if (tenant) {
    tenant.status = 'active';
    tenant.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      code: 200,
      message: 'Tenant activated successfully',
      data: tenant
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Tenant not found'
    });
  }
});

app.post('/api/tenants/:id/suspend', (req, res) => {
  const tenant = mockTenants.find(t => t.id === req.params.id);
  
  if (tenant) {
    tenant.status = 'suspended';
    tenant.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      code: 200,
      message: 'Tenant suspended successfully',
      data: tenant
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Tenant not found'
    });
  }
});

// Orders API
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
  
  const total = filteredOrders.length;
  const data = filteredOrders.slice(start, end);
  
  res.json({
    success: true,
    code: 200,
    message: 'success',
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  
  if (order) {
    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: order
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Order not found'
    });
  }
});

app.post('/api/orders', (req, res) => {
  // 参数验证
  const { tenantId, type, paymentMethod, items } = req.body;
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'tenantId is required'
    });
  }
  
  if (!type || !['seat', 'package', 'topup', 'invoice'].includes(type)) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'Invalid order type. Must be one of: seat, package, topup, invoice'
    });
  }
  
  if (!paymentMethod || !['alipay', 'wechat', 'bank_transfer', 'coupon'].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'Invalid payment method. Must be one of: alipay, wechat, bank_transfer, coupon'
    });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'Items array is required and cannot be empty'
    });
  }
  
  // 验证每个订单项
  for (const item of items) {
    if (!item.name || typeof item.name !== 'string') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Each item must have a valid name'
      });
    }
    if (!item.quantity || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Each item must have a quantity greater than 0'
      });
    }
    if (!item.unitPrice || item.unitPrice <= 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Each item must have a unit price greater than 0'
      });
    }
  }
  
  const newOrder = {
    id: 'order-' + uuidv4().slice(0, 8),
    tenantId,
    type,
    paymentMethod,
    status: 'pending',
    paidAmount: 0,
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({
      ...item,
      id: 'item-' + uuidv4().slice(0, 8),
      totalPrice: item.quantity * item.unitPrice
    }))
  };
  
  // Calculate total amount
  newOrder.totalAmount = newOrder.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Get tenant name
  const tenant = mockTenants.find(t => t.id === newOrder.tenantId);
  if (tenant) {
    newOrder.tenantName = tenant.name;
  } else {
    newOrder.tenantName = 'Unknown';
  }
  
  mockOrders.push(newOrder);
  
  res.status(201).json({
    success: true,
    code: 201,
    message: 'Order created successfully',
    data: newOrder
  });
});

// PUT 更新订单
app.put('/api/orders/:id', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      code: 404,
      message: 'Order not found'
    });
  }
  
  // 不能更新已激活、已取消或已确认的订单（只能更新待处理订单）
  if (order.status === 'activated') {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'Cannot update an activated order'
    });
  }
  
  if (order.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'Cannot update a cancelled order'
    });
  }
  
  if (order.status === 'confirmed') {
    return res.status(400).json({
      success: false,
      code: 400,
      message: 'Cannot update a confirmed order'
    });
  }
  
  const { items, paymentMethod, type } = req.body;
  
  // 更新订单类型
  if (type) {
    if (!['seat', 'package', 'topup', 'invoice'].includes(type)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Invalid order type. Must be one of: seat, package, topup, invoice'
      });
    }
    order.type = type;
  }
  
  // 更新支付方式
  if (paymentMethod) {
    if (!['alipay', 'wechat', 'bank_transfer', 'coupon'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Invalid payment method. Must be one of: alipay, wechat, bank_transfer, coupon'
      });
    }
    order.paymentMethod = paymentMethod;
  }
  
  // 更新订单项
  if (items && Array.isArray(items) && items.length > 0) {
    // 验证每个订单项
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string') {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'Each item must have a valid name'
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'Each item must have a quantity greater than 0'
        });
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'Each item must have a unit price greater than 0'
        });
      }
    }
    
    order.items = items.map((item) => ({
      ...item,
      id: 'item-' + uuidv4().slice(0, 8),
      totalPrice: item.quantity * item.unitPrice
    }));
    
    // 重新计算总金额
    order.totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  
  // 更新关联的企业名称
  const tenant = mockTenants.find(t => t.id === order.tenantId);
  if (tenant) {
    order.tenantName = tenant.name;
  }
  
  res.json({
    success: true,
    code: 200,
    message: 'Order updated successfully',
    data: order
  });
});

app.post('/api/orders/:id/confirm-payment', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  const { actualAmount } = req.body;
  
  if (order) {
    if (actualAmount <= 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Amount must be greater than 0'
      });
    }
    
    if (actualAmount > order.totalAmount * 1.5) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Amount exceeds maximum allowed (150% of order total)'
      });
    }
    
    order.paidAmount = actualAmount;
    order.status = 'confirmed';
    order.confirmedAt = new Date().toISOString();
    
    res.json({
      success: true,
      code: 200,
      message: 'Payment confirmed successfully',
      data: order
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Order not found'
    });
  }
});

app.post('/api/orders/:id/cancel', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  
  if (order) {
    if (order.status === 'activated') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Cannot cancel an activated order'
      });
    }
    
    order.status = 'cancelled';
    
    res.json({
      success: true,
      code: 200,
      message: 'Order cancelled successfully',
      data: order
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Order not found'
    });
  }
});

app.post('/api/orders/:id/activate', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  
  if (order) {
    if (order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Only confirmed orders can be activated'
      });
    }
    
    order.status = 'activated';
    
    res.json({
      success: true,
      code: 200,
      message: 'Order activated successfully',
      data: order
    });
  } else {
    res.status(404).json({
      success: false,
      code: 404,
      message: 'Order not found'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    code: 200,
    message: 'Mock server is running'
  });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/tenants');
  console.log('  GET  /api/tenants/:id');
  console.log('  POST /api/tenants');
  console.log('  PUT  /api/tenants/:id');
  console.log('  DELETE /api/tenants/:id');
  console.log('  POST /api/tenants/:id/activate');
  console.log('  POST /api/tenants/:id/suspend');
  console.log('  GET  /api/orders');
  console.log('  GET  /api/orders/:id');
  console.log('  POST /api/orders');
  console.log('  POST /api/orders/:id/confirm-payment');
  console.log('  POST /api/orders/:id/cancel');
  console.log('  POST /api/orders/:id/activate');
});
