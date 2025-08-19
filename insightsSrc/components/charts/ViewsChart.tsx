import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Mock data for views chart
const generateViewsData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Generate some realistic-looking data with some trends
    let views = Math.floor(Math.random() * 200) + 50;
    // Add some trends and patterns
    if (date.getDay() === 0 || date.getDay() === 6) {
      views = views * 0.7; // Less views on weekends
    }
    // Random spike days
    if (Math.random() > 0.9) {
      views = views * 2;
    }
    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      views: Math.round(views)
    });
  }
  return data;
};
interface ViewsChartProps {
  timeRange: string;
}
export function ViewsChart({
  timeRange
}: ViewsChartProps) {
  // Convert timeRange to number of days
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const data = generateViewsData(days);
  return <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{
        top: 5,
        right: 10,
        left: 0,
        bottom: 5
      }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{
          fontSize: 10,
          fill: '#9CA3AF'
        }}
        // For longer time ranges, show fewer ticks
        interval={days > 30 ? 10 : days > 7 ? 5 : 1} />
          <YAxis tickLine={false} axisLine={false} tick={{
          fontSize: 10,
          fill: '#9CA3AF'
        }} />
          <Tooltip contentStyle={{
          backgroundColor: '#1F2937',
          borderColor: '#374151',
          color: '#F9FAFB'
        }} />
          <Line type="monotone" dataKey="views" stroke="#EAB308" strokeWidth={2} dot={false} activeDot={{
          r: 4
        }} />
        </LineChart>
      </ResponsiveContainer>
    </div>;
}