import { Empty, Typography } from '@arco-design/web-react';

const { Title, Text } = Typography;

export default function UnderConstructionPage() {
  return (
    <div className="page-card page-card--empty">
      <Empty
        description={
          <div>
            <Title heading={5}>建设中</Title>
            <Text type="secondary">该模块已预留路由与导航入口，后续按 PRD 对接对应 ArkClaw OpenAPI。</Text>
          </div>
        }
      />
    </div>
  );
}
