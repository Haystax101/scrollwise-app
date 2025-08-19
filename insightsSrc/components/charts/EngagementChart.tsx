import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Mock data for engagement metrics
const data = [{
  name: 'Likes',
  count: 335,
  fill: '#EAB308' // Yellow
}, {
  name: 'Comments',
  count: 118,
  fill: '#3B82F6' // Blue
}, {
  name: 'Reposts',
  count: 65,
  fill: '#10B981' // Green
}, {
  name: 'Saves',
  count: 264,
  fill: '#8B5CF6' // Purple
}];
export function EngagementChart() {
  return <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{
        top: 5,
        right: 10,
        left: 0,
        bottom: 5
      }} barSize={30}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{
          fontSize: 10,
          fill: '#9CA3AF'
        }} />
          <YAxis tickLine={false} axisLine={false} tick={{
          fontSize: 10,
          fill: '#9CA3AF'
        }} />
          <Tooltip contentStyle={{
          backgroundColor: '#1F2937',
          borderColor: '#374151',
          color: '#F9FAFB'
        }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>;
}