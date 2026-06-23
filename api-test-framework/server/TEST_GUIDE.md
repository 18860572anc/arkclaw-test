# API 接口测试指南

## 基础信息

- **服务器地址**: http://localhost:3001
- **启动命令**: `cd api-test-framework/server && npm start`

---

## 📋 企业管理接口 (/api/tenants)

### 1. 获取企业列表
```bash
GET /api/tenants?page=1&pageSize=20
```

### 2. 获取单个企业详情
```bash
GET /api/tenants/tenant-001
```

### 3. 创建企业
```bash
POST /api/tenants
Content-Type: application/json

{
  "name": "新企业名称",
  "uscc": "91310101MA1G899999",
  "adminName": "管理员姓名",
  "adminEmail": "admin@example.com",
  "adminPhone": "13800138000"
}
```

### 4. 更新企业信息
```bash
PUT /api/tenants/tenant-001
Content-Type: application/json

{
  "name": "更新后的企业名称",
  "adminPhone": "13900139000"
}
```

### 5. 删除企业
```bash
DELETE /api/tenants/tenant-001
```

### 6. 激活企业
```bash
POST /api/tenants/tenant-001/activate
```

### 7. 暂停企业
```bash
POST /api/tenants/tenant-001/suspend
```

---

## 📦 订单管理接口 (/api/orders)

### 1. 获取订单列表
```bash
GET /api/orders?page=1&pageSize=20&status=pending
```

### 2. 获取单个订单详情
```bash
GET /api/orders/order-001
```

### 3. 创建订单
```bash
POST /api/orders
Content-Type: application/json

{
  "tenantId": "tenant-001",
  "type": "seat",
  "paymentMethod": "bank_transfer",
  "items": [
    {
      "name": "基础席位",
      "quantity": 5,
      "unitPrice": 1000
    }
  ]
}
```

**必填字段**:
- `tenantId`: 企业ID
- `type`: 订单类型 (seat | package | topup | invoice)
- `paymentMethod`: 支付方式 (alipay | wechat | bank_transfer | coupon)
- `items`: 订单项数组（不能为空）

**订单项验证**:
- `name`: 名称（必填）
- `quantity`: 数量（必须 > 0）
- `unitPrice`: 单价（必须 > 0）

### 4. 更新订单
```bash
PUT /api/orders/order-001
Content-Type: application/json

{
  "type": "package",
  "paymentMethod": "alipay",
  "items": [
    {
      "name": "升级套餐",
      "quantity": 10,
      "unitPrice": 1500
    }
  ]
}
```

**可更新字段**:
- `type`: 订单类型
- `paymentMethod`: 支付方式
- `items`: 订单项（会重新计算总金额）

**限制条件**:
- ❌ 不能更新已激活(activated)的订单
- ❌ 不能更新已取消(cancelled)的订单
- ❌ 不能更新已确认(confirmed)的订单
- ✅ 只能更新待处理(pending)状态的订单

### 5. 确认支付
```bash
POST /api/orders/order-001/confirm-payment
Content-Type: application/json

{
  "actualAmount": 5000
}
```

**验证规则**:
- 金额必须 > 0
- 金额不能超过订单金额的 150%

### 6. 取消订单
```bash
POST /api/orders/order-001/cancel
Content-Type: application/json

{
  "reason": "客户取消"
}
```

**限制条件**:
- ❌ 不能取消已激活(activated)的订单

### 7. 开通服务
```bash
POST /api/orders/order-001/activate
```

**限制条件**:
- ✅ 只有已确认(confirmed)状态的订单才能开通

---

## 🔍 测试用例

### 创建订单 - 正常流程
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "type": "seat",
    "paymentMethod": "bank_transfer",
    "items": [
      {"name": "基础席位", "quantity": 5, "unitPrice": 1000}
    ]
  }'
```

### 创建订单 - 缺少必填字段
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"type": "seat"}'
# 预期: {"success": false, "code": 400, "message": "tenantId is required"}
```

### 创建订单 - 无效的订单类型
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "type": "invalid_type",
    "paymentMethod": "bank_transfer",
    "items": [{"name": "测试", "quantity": 1, "unitPrice": 100}]
  }'
# 预期: {"success": false, "code": 400, "message": "Invalid order type..."}
```

### 创建订单 - 空订单项数组
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-001",
    "type": "seat",
    "paymentMethod": "bank_transfer",
    "items": []
  }'
# 预期: {"success": false, "code": 400, "message": "Items array is required and cannot be empty"}
```

### 更新订单 - 正常流程
```bash
curl -X PUT http://localhost:3001/api/orders/order-001 \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "alipay",
    "items": [
      {"name": "升级套餐", "quantity": 15, "unitPrice": 1500}
    ]
  }'
# 预期: 更新支付方式并重新计算总金额
```

### 更新订单 - 不能更新已激活的订单
```bash
curl -X PUT http://localhost:3001/api/orders/order-004 \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "wechat"}'
# 预期: {"success": false, "code": 400, "message": "Cannot update an activated order"}
```

### 更新订单 - 不能更新已确认的订单
```bash
curl -X PUT http://localhost:3001/api/orders/order-002 \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "wechat"}'
# 预期: {"success": false, "code": 400, "message": "Cannot update a confirmed order"}
```

### 确认支付 - 正常流程
```bash
curl -X POST http://localhost:3001/api/orders/order-001/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"actualAmount": 10000}'
```

### 确认支付 - 负数金额
```bash
curl -X POST http://localhost:3001/api/orders/order-001/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"actualAmount": -100}'
# 预期: {"success": false, "code": 400, "message": "Amount must be greater than 0"}
```

### 确认支付 - 超额金额
```bash
curl -X POST http://localhost:3001/api/orders/order-003/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"actualAmount": 8000}'
# 预期: {"success": false, "code": 400, "message": "Amount exceeds maximum allowed (150% of order total)"}
```

---

## 📊 订单状态流转

```
pending (待处理)
    ↓
confirmed (已确认) - 支付确认后
    ↓
activated (已激活) - 服务开通后

cancelled (已取消) - 任意阶段可取消
```

---

## 🔐 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |

---

## 📝 注意事项

1. **订单更新限制**: 订单一旦确认或激活，就不能修改
2. **金额验证**: 确认支付金额必须在订单金额的 0-150% 之间
3. **状态流转**: 必须先确认支付，才能开通服务
4. **企业关联**: 订单会自动关联企业名称
