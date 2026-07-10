"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SimpleChartData {
  name: string;
  value: number;
}

export function CustomLineChart({ data }: { data: SimpleChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#6366f1" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CustomBarChart({ data }: { data: SimpleChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CohortRow {
  cohortMonth: string;
  totalUsers: number;
  retentionRate: number;
}

export function CohortChart({ data }: { data: CohortRow[] }) {
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 pr-3 font-medium text-muted-foreground">
              Cohort
            </th>
            <th className="text-right py-1 pr-3 font-medium text-muted-foreground">
              Users
            </th>
            <th className="text-right py-1 font-medium text-muted-foreground">
              Retention
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.cohortMonth} className="border-b last:border-0">
              <td className="py-1 pr-3">
                {new Date(row.cohortMonth).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                })}
              </td>
              <td className="text-right py-1 pr-3">
                {row.totalUsers.toLocaleString()}
              </td>
              <td className="text-right py-1">
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    background: `hsl(${Math.round(row.retentionRate * 1.2)}, 70%, 90%)`,
                    color: `hsl(${Math.round(row.retentionRate * 1.2)}, 60%, 30%)`,
                  }}
                >
                  {row.retentionRate.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
