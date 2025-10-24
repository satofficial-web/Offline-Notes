import React, { useMemo } from 'react';
import type { Note } from '../types';

interface StatsChartProps {
    notes: Note[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ notes }) => {
    const activityData = useMemo(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const data = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            return {
                date,
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: 0
            };
        }).reverse();

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        notes.forEach(note => {
            if (note.updatedAt >= sevenDaysAgo.getTime()) {
                const updatedDate = new Date(note.updatedAt);
                const dayIndex = data.findIndex(d => 
                    d.date.getFullYear() === updatedDate.getFullYear() &&
                    d.date.getMonth() === updatedDate.getMonth() &&
                    d.date.getDate() === updatedDate.getDate()
                );
                if (dayIndex > -1) {
                    data[dayIndex].count++;
                }
            }
        });

        return data;
    }, [notes]);

    const maxCount = Math.max(...activityData.map(d => d.count), 1); // Avoid division by zero

    return (
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-md">
            <h4 className="text-md font-bold mb-4 text-slate-700 dark:text-slate-300">Last 7 Days Activity</h4>
            <div className="flex justify-between items-end h-32 space-x-2">
                {activityData.map(({ day, count }, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                            className="w-full bg-blue-400 dark:bg-blue-500 rounded-t-md hover:opacity-80 transition-opacity"
                            style={{ height: `${(count / maxCount) * 100}%` }}
                            title={`${count} notes updated`}
                        >
                        </div>
                        <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">{day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};