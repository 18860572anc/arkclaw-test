import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Message,
  Space,
  Typography,
} from '@arco-design/web-react';
import { IconSafe } from '@arco-design/web-react/icon';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [account, setAccount] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSendCode = () => {
    if (!account.trim()) {
      Message.error('请先输入手机号或邮箱');
      return;
    }
    Message.success('验证码已发送');
  };

  const handleSubmit = () => {
    if (!account.trim() || !code.trim() || !newPassword.trim()) {
      Message.error('请填写完整的找回信息');
      return;
    }
    if (newPassword.length < 8) {
      Message.error('新密码至少 8 位');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="public-register">
      <Card className="public-register-card public-register-card--success" bordered>
        <Space direction="vertical" size={18} className="full-width">
          {submitted ? (
            <>
              <IconSafe className="public-register-success-icon" />
              <div>
                <Title heading={4}>密码已重置</Title>
                <Text type="secondary">请使用新密码重新登录 ArkClaw。</Text>
              </div>
              <Link to="/login">
                <Button type="primary">返回登录</Button>
              </Link>
            </>
          ) : (
            <>
              <div>
                <Title heading={4}>忘记密码</Title>
                <Text type="secondary">通过手机号或邮箱验证后重置管理员账号密码。</Text>
              </div>

              <div className="sales-form-grid sales-form-grid--single">
                <label>
                  <span>手机号或邮箱</span>
                  <Input value={account} onChange={setAccount} placeholder="请输入手机号或邮箱" />
                </label>
                <label>
                  <span>验证码</span>
                  <div className="forgot-password-code">
                    <Input value={code} onChange={setCode} placeholder="请输入验证码" />
                    <Button onClick={handleSendCode}>获取验证码</Button>
                  </div>
                </label>
                <label>
                  <span>新密码</span>
                  <Input.Password value={newPassword} onChange={setNewPassword} placeholder="至少 8 位" />
                </label>
              </div>

              <Space>
                <Button type="primary" onClick={handleSubmit}>
                  重置密码
                </Button>
                <Link to="/login">
                  <Button>返回登录</Button>
                </Link>
              </Space>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
