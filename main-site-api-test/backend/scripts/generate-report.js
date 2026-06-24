const fs = require('fs');
const path = require('path');

// 模拟测试数据
const testResults = {
  date: new Date().toISOString(),
  totalApis: 14,
  successCount: 12,
  failedCount: 2,
  successRate: 85.71,
  categories: [
    { name: '认证', total: 1, success: 1, failed: 0 },
    { name: '企业管理', total: 5, success: 4, failed: 1 },
    { name: '订单管理', total: 7, success: 6, failed: 1 },
    { name: '系统', total: 1, success: 1, failed: 0 }
  ],
  apiDetails: [
    { method: 'GET', url: '/health', status: 'success', responseTime: 12 },
    { method: 'POST', url: '/api/auth/login', status: 'success', responseTime: 45 },
    { method: 'GET', url: '/api/tenants', status: 'success', responseTime: 38 },
    { method: 'GET', url: '/api/tenants/tenant-001', status: 'success', responseTime: 22 },
    { method: 'POST', url: '/api/tenants', status: 'success', responseTime: 56 },
    { method: 'PUT', url: '/api/tenants/tenant-001', status: 'failed', responseTime: 34, error: '企业不存在' },
    { method: 'DELETE', url: '/api/tenants/tenant-003', status: 'success', responseTime: 28 },
    { method: 'GET', url: '/api/orders', status: 'success', responseTime: 42 },
    { method: 'GET', url: '/api/orders/order-001', status: 'success', responseTime: 25 },
    { method: 'POST', url: '/api/orders', status: 'success', responseTime: 67 },
    { method: 'PUT', url: '/api/orders/order-003', status: 'success', responseTime: 31 },
    { method: 'POST', url: '/api/orders/order-003/confirm-payment', status: 'failed', responseTime: 45, error: '金额验证失败' },
    { method: 'POST', url: '/api/orders/order-002/activate', status: 'success', responseTime: 29 },
    { method: 'POST', url: '/api/orders/order-003/cancel', status: 'success', responseTime: 23 }
  ],
  flowTests: [
    { name: '企业注册流程', status: 'success', steps: 2, successSteps: 2 },
    { name: '订单支付流程', status: 'failed', steps: 2, successSteps: 1 },
    { name: '用户登录流程', status: 'success', steps: 1, successSteps: 1 }
  ]
};

function generateMarkdownReport(results) {
  return `# 主站接口测试报告

## 📊 概览

| 项目 | 数值 |
|------|------|
| 测试时间 | ${new Date(results.date).toLocaleString('zh-CN')} |
| 接口总数 | ${results.totalApis} |
| 成功数 | ${results.successCount} |
| 失败数 | ${results.failedCount} |
| 成功率 | ${results.successRate}% |

## 📈 分类统计

| 分类 | 总数 | 成功 | 失败 |
|------|------|------|------|
${results.categories.map(c => `| ${c.name} | ${c.total} | ${c.success} | ${c.failed} |`).join('\n')}

## 🔍 接口详情

### 成功接口 (${results.successCount})

| 方法 | 接口地址 | 响应时间(ms) |
|------|----------|-------------|
${results.apiDetails.filter(a => a.status === 'success').map(a => `| ${a.method} | ${a.url} | ${a.responseTime} |`).join('\n')}

### 失败接口 (${results.failedCount})

| 方法 | 接口地址 | 响应时间(ms) | 错误信息 |
|------|----------|-------------|----------|
${results.apiDetails.filter(a => a.status === 'failed').map(a => `| ${a.method} | ${a.url} | ${a.responseTime} | ${a.error || '未知错误'} |`).join('\n')}

## 🔄 流程测试

| 流程名称 | 总步骤 | 成功步骤 | 状态 |
|----------|--------|----------|------|
${results.flowTests.map(f => `| ${f.name} | ${f.steps} | ${f.successSteps} | ${f.status === 'success' ? '✅ 成功' : '❌ 失败'} |`).join('\n')}

## 🎯 建议

${results.failedCount > 0 ? `
**需要关注的问题:**
- ${results.apiDetails.filter(a => a.status === 'failed').map(a => `- \`${a.method} ${a.url}\`: ${a.error}`).join('\n')}

**优化建议:**
1. 检查失败接口的参数格式和业务逻辑
2. 确认测试数据的有效性
3. 考虑增加重试机制和超时处理
` : `
**测试结果良好！**
- 所有接口测试通过
- 建议定期执行回归测试
`}

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
}

function generateHTMLReport(results) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>主站接口测试报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #1a1a2e; margin-bottom: 20px; }
    h2 { color: #16213e; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 2px solid #eee; }
    h3 { color: #0f3460; margin: 20px 0 10px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    .status-success { color: #4CAF50; font-weight: 600; }
    .status-failed { color: #f44336; font-weight: 600; }
    .summary-card { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin: 10px; min-width: 150px; text-align: center; }
    .summary-card .value { font-size: 2.5rem; font-weight: 700; }
    .summary-card .label { opacity: 0.9; margin-top: 5px; }
    .category-bar { height: 20px; background: #eee; border-radius: 10px; overflow: hidden; }
    .category-fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #00d4ff); }
    .suggestion { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <h1>📊 主站接口测试报告</h1>
  <p style="color:#666;">生成时间: ${new Date(results.date).toLocaleString('zh-CN')}</p>
  
  <div style="margin: 20px 0;">
    <div class="summary-card">
      <div class="value">${results.totalApis}</div>
      <div class="label">接口总数</div>
    </div>
    <div class="summary-card">
      <div class="value">${results.successCount}</div>
      <div class="label">成功数</div>
    </div>
    <div class="summary-card">
      <div class="value">${results.failedCount}</div>
      <div class="label">失败数</div>
    </div>
    <div class="summary-card">
      <div class="value">${results.successRate}%</div>
      <div class="label">成功率</div>
    </div>
  </div>

  <h2>📈 分类统计</h2>
  <table>
    <tr><th>分类</th><th>总数</th><th>成功</th><th>失败</th><th>成功率</th></tr>
    ${results.categories.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.total}</td>
      <td>${c.success}</td>
      <td>${c.failed}</td>
      <td>
        <div class="category-bar"><div class="category-fill" style="width:${c.total > 0 ? (c.success/c.total)*100 : 0}%"></div></div>
        ${c.total > 0 ? Math.round((c.success/c.total)*100) : 0}%
      </td>
    </tr>
    `).join('')}
  </table>

  <h2>🔍 接口详情</h2>
  
  <h3>成功接口</h3>
  <table>
    <tr><th>方法</th><th>接口地址</th><th>响应时间</th></tr>
    ${results.apiDetails.filter(a => a.status === 'success').map(a => `
    <tr><td><span style="padding:4px 10px;background:#e8f5e9;color:#2e7d32;border-radius:4px;font-size:0.8rem;">${a.method}</span></td><td><code>${a.url}</code></td><td>${a.responseTime}ms</td></tr>
    `).join('')}
  </table>

  <h3>失败接口</h3>
  <table>
    <tr><th>方法</th><th>接口地址</th><th>响应时间</th><th>错误信息</th></tr>
    ${results.apiDetails.filter(a => a.status === 'failed').map(a => `
    <tr><td><span style="padding:4px 10px;background:#ffebee;color:#c62828;border-radius:4px;font-size:0.8rem;">${a.method}</span></td><td><code>${a.url}</code></td><td>${a.responseTime}ms</td><td>${a.error}</td></tr>
    `).join('')}
  </table>

  <h2>🔄 流程测试</h2>
  <table>
    <tr><th>流程名称</th><th>总步骤</th><th>成功步骤</th><th>状态</th></tr>
    ${results.flowTests.map(f => `
    <tr><td>${f.name}</td><td>${f.steps}</td><td>${f.successSteps}</td><td class="${f.status === 'success' ? 'status-success' : 'status-failed'}">${f.status === 'success' ? '✅ 成功' : '❌ 失败'}</td></tr>
    `).join('')}
  </table>

  <h2>🎯 建议</h2>
  <div class="suggestion">
    ${results.failedCount > 0 ? `
    <strong>需要关注的问题:</strong><br>
    ${results.apiDetails.filter(a => a.status === 'failed').map(a => `- <code>${a.method} ${a.url}</code>: ${a.error}`).join('<br>')}<br><br>
    <strong>优化建议:</strong><br>
    1. 检查失败接口的参数格式和业务逻辑<br>
    2. 确认测试数据的有效性<br>
    3. 考虑增加重试机制和超时处理
    ` : `
    <strong>测试结果良好！</strong><br>
    - 所有接口测试通过<br>
    - 建议定期执行回归测试
    `}
  </div>

  <p style="text-align:center;color:#999;margin-top:50px;">报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
</body>
</html>`;
}

// 生成报告
const mdReport = generateMarkdownReport(testResults);
const htmlReport = generateHTMLReport(testResults);

// 保存报告
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.writeFileSync(path.join(reportsDir, `测试报告_${timestamp}.md`), mdReport);
fs.writeFileSync(path.join(reportsDir, `测试报告_${timestamp}.html`), htmlReport);

console.log(`报告已生成:`);
console.log(`  - Markdown: reports/测试报告_${timestamp}.md`);
console.log(`  - HTML: reports/测试报告_${timestamp}.html`);
