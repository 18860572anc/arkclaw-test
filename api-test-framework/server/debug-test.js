// 测试脚本 - 验证前端页面的JavaScript逻辑
const fs = require('fs');

// 读取index.js中的前端脚本部分
const indexContent = fs.readFileSync('/Users/apple/Desktop/ArkClaw_Beta1_测试覆盖文档/api-test-framework/server/index.js', 'utf8');

// 找到脚本部分
const scriptStart = indexContent.indexOf('<script>');
const scriptEnd = indexContent.lastIndexOf('</script>');

if (scriptStart !== -1 && scriptEnd !== -1) {
  const scriptContent = indexContent.substring(scriptStart, scriptEnd + 9);
  console.log('=== 前端脚本内容 ===');
  console.log(scriptContent);
  
  // 检查是否包含关键函数
  if (scriptContent.includes('handleTestClick')) {
    console.log('\n✅ handleTestClick 函数已定义');
  } else {
    console.log('\n❌ handleTestClick 函数未定义');
  }
  
  if (scriptContent.includes('addEventListener')) {
    console.log('✅ addEventListener 已使用');
  } else {
    console.log('❌ addEventListener 未使用');
  }
  
  // 检查脚本语法（简单检查）
  const hasSyntaxError = scriptContent.includes('async function') && !scriptContent.includes('await');
  if (hasSyntaxError) {
    console.log('⚠️ 可能存在语法问题');
  }
} else {
  console.log('无法找到脚本部分');
}