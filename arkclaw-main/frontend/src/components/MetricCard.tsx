import { Card, Typography } from '@arco-design/web-react';
import type { Metric } from '../types/domain';

const { Text, Title } = Typography;

interface MetricCardProps {
  metric: Metric;
}

export default function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card className="metric-card" bordered>
      <Text className="muted-label">{metric.label}</Text>
      <div className="metric-card__body">
        <Title heading={3}>{metric.value}</Title>
        {metric.suffix ? <Text>{metric.suffix}</Text> : null}
      </div>
      {metric.trend ? <Text className="metric-card__trend">{metric.trend}</Text> : null}
    </Card>
  );
}
