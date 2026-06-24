#!/bin/bash
# API接口测试脚本

BASE_URL="http://localhost:3001"

echo "========================================"
echo "ArkClaw Mock Server API 测试"
echo "========================================"
echo ""

# 测试1: 健康检查
echo "1️⃣ 测试健康检查..."
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"
echo ""
echo "----------------------------------------"

# 测试2: 获取企业列表
echo "2️⃣ 测试获取企业列表..."
curl -s "$BASE_URL/api/tenants" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/tenants"
echo ""
echo "----------------------------------------"

# 测试3: 获取企业详情
echo "3️⃣ 测试获取企业详情..."
curl -s "$BASE_URL/api/tenants/tenant-001" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/tenants/tenant-001"
echo ""
echo "----------------------------------------"

# 测试4: 创建企业
echo "4️⃣ 测试创建企业..."
curl -s -X POST "$BASE_URL/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试企业","uscc":"91310101MA12345678","adminName":"管理员","adminPhone":"13800138000"}' | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/tenants" -H "Content-Type: application/json" -d '{"name":"测试企业","uscc":"91310101MA12345678","adminName":"管理员","adminPhone":"13800138000"}'
echo ""
echo "----------------------------------------"

# 测试5: 获取订单列表
echo "5️⃣ 测试获取订单列表..."
curl -s "$BASE_URL/api/orders" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/orders"
echo ""
echo "----------------------------------------"

# 测试6: 创建订单
echo "6️⃣ 测试创建订单..."
curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"tenant-001","type":"seat","paymentMethod":"bank_transfer","items":[{"name":"席位","quantity":10,"unitPrice":1000}]}' | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/orders" -H "Content-Type: application/json" -d '{"tenantId":"tenant-001","type":"seat","paymentMethod":"bank_transfer","items":[{"name":"席位","quantity":10,"unitPrice":1000}]}'
echo ""
echo "----------------------------------------"

# 测试7: 用户登录
echo "7️⃣ 测试用户登录..."
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"17630059309","password":"12345qwe","domain":"localhost"}' | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{"username":"17630059309","password":"12345qwe","domain":"localhost"}'
echo ""
echo "----------------------------------------"

echo ""
echo "✅ 所有API测试完成！"
echo "打开浏览器访问: http://localhost:3001"
