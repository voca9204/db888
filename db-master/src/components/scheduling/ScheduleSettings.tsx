import React, { useState } from 'react';
import { ScheduleFrequency } from '../../firebase/models/scheduling';
import { Input, Select } from '../ui';
import { format } from 'date-fns';

type ScheduleProps = {
  frequency: ScheduleFrequency;
  schedule: {
    startTime: Date;
    endTime?: Date;
    timeZone: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    hour?: number;
    minute?: number;
    cronExpression?: string;
  };
  onChange: (schedule: any) => void;
};

// 시간대 목록
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Australia/Sydney',
];

// 요일 목록
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const ScheduleSettings: React.FC<ScheduleProps> = ({ frequency, schedule, onChange }) => {
  // 시작 시간 변경 핸들러
  const handleStartTimeChange = (date: string) => {
    onChange({ startTime: new Date(date) });
  };
  
  // 종료 시간 변경 핸들러
  const handleEndTimeChange = (date: string) => {
    onChange({ endTime: date ? new Date(date) : undefined });
  };
  
  // 시간대 변경 핸들러
  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ timeZone: e.target.value });
  };
  
  // 요일 변경 핸들러
  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    const currentDays = schedule.daysOfWeek || [];
    
    if (checked) {
      onChange({
        daysOfWeek: [...currentDays, day].sort((a, b) => a - b),
      });
    } else {
      onChange({
        daysOfWeek: currentDays.filter(d => d !== day),
      });
    }
  };
  
  // 월 날짜 변경 핸들러
  const handleDayOfMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    
    if (!isNaN(value) && value >= 1 && value <= 31) {
      onChange({ dayOfMonth: value });
    }
  };
  
  // 시간 변경 핸들러
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    
    if (!isNaN(value) && value >= 0 && value <= 23) {
      onChange({ hour: value });
    }
  };
  
  // 분 변경 핸들러
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    
    if (!isNaN(value) && value >= 0 && value <= 59) {
      onChange({ minute: value });
    }
  };
  
  // CRON 표현식 변경 핸들러
  const handleCronExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ cronExpression: e.target.value });
  };
  
  // 빈도별 설정 UI
  const renderFrequencySettings = () => {
    switch (frequency) {
      case ScheduleFrequency.ONCE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Execution Time</label>
              <Input
                type="datetime-local"
                value={format(schedule.startTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
            </div>
          </div>
        );
      
      case ScheduleFrequency.HOURLY:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Minute</label>
              <div className="flex items-center">
                <Input
                  type="number"
                  value={schedule.minute || 0}
                  onChange={handleMinuteChange}
                  min={0}
                  max={59}
                  className="w-24"
                />
                <span className="ml-2">minutes past each hour</span>
              </div>
            </div>
          </div>
        );
      
      case ScheduleFrequency.DAILY:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={schedule.hour || 0}
                  onChange={handleHourChange}
                  min={0}
                  max={23}
                  className="w-24"
                />
                <span>:</span>
                <Input
                  type="number"
                  value={schedule.minute || 0}
                  onChange={handleMinuteChange}
                  min={0}
                  max={59}
                  className="w-24"
                />
                <span className="ml-2">hours (24-hour format)</span>
              </div>
            </div>
          </div>
        );
      
      case ScheduleFrequency.WEEKLY:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Days of Week</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <label key={day.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(schedule.daysOfWeek || []).includes(day.value)}
                      onChange={(e) => handleDayOfWeekChange(day.value, e.target.checked)}
                      className="mr-2"
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={schedule.hour || 0}
                  onChange={handleHourChange}
                  min={0}
                  max={23}
                  className="w-24"
                />
                <span>:</span>
                <Input
                  type="number"
                  value={schedule.minute || 0}
                  onChange={handleMinuteChange}
                  min={0}
                  max={59}
                  className="w-24"
                />
                <span className="ml-2">hours (24-hour format)</span>
              </div>
            </div>
          </div>
        );
      
      case ScheduleFrequency.MONTHLY:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Day of Month</label>
              <div className="flex items-center">
                <Input
                  type="number"
                  value={schedule.dayOfMonth || 1}
                  onChange={handleDayOfMonthChange}
                  min={1}
                  max={31}
                  className="w-24"
                />
                <span className="ml-2">day of each month</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={schedule.hour || 0}
                  onChange={handleHourChange}
                  min={0}
                  max={23}
                  className="w-24"
                />
                <span>:</span>
                <Input
                  type="number"
                  value={schedule.minute || 0}
                  onChange={handleMinuteChange}
                  min={0}
                  max={59}
                  className="w-24"
                />
                <span className="ml-2">hours (24-hour format)</span>
              </div>
            </div>
          </div>
        );
      
      case ScheduleFrequency.CUSTOM:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">CRON Expression</label>
              <Input
                value={schedule.cronExpression || ''}
                onChange={handleCronExpressionChange}
                placeholder="0 0 * * *"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Format: minute hour day month day_of_week (e.g., "0 0 * * *" for daily at midnight)
              </p>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {renderFrequencySettings()}
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium mb-1">Time Zone</label>
          <Select
            value={schedule.timeZone}
            onChange={handleTimezoneChange}
          >
            {TIMEZONES.map(zone => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </Select>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Input
            type="date"
            value={format(schedule.startTime, 'yyyy-MM-dd')}
            onChange={(e) => {
              const date = new Date(e.target.value);
              const currentTime = schedule.startTime;
              
              // 시간은 유지하고 날짜만 변경
              date.setHours(
                currentTime.getHours(),
                currentTime.getMinutes(),
                currentTime.getSeconds(),
                currentTime.getMilliseconds()
              );
              
              onChange({ startTime: date });
            }}
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Scheduled query will start executing from this date
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
          <Input
            type="date"
            value={schedule.endTime ? format(schedule.endTime, 'yyyy-MM-dd') : ''}
            onChange={(e) => handleEndTimeChange(e.target.value)}
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Scheduled query will stop executing after this date
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSettings;
