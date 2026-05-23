import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";

export function StatsCard({ title, value, description, trend, theme = "dark" }) {
  return (
    <div className={`panel-theme-${theme}`}>
      <Card className="panel-base backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-theme-accent">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-bold uppercase animate-pulse text-theme-main">
            {value}
          </div>
          {description && (
            <p className="text-[11px] font-mono mt-1 text-theme-muted">{description}</p>
          )}
          {trend && (
            <p className={`text-[11px] font-mono mt-1 flex items-center gap-1 ${
              trend.isPositive ? 'text-emerald-500' : 'text-red-500'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% vs. mês anterior</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StatsCard;