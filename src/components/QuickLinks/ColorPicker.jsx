import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Violet', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Slate', value: '#64748B' },
];

const ColorPicker = ({ value, onChange, label = 'Color' }) => {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-card-foreground">
        {label}
      </Label>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className="relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{
              backgroundColor: color.value,
              borderColor: value === color.value ? '#1F2937' : 'transparent',
            }}
            title={color.name}
          >
            {value === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-3.5 h-3.5 text-gray-900" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Section */}
      <div className="pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showCustom ? 'Hide custom color' : 'Use custom color'}
        </button>

        {showCustom && (
          <div className="flex items-center gap-3 mt-3">
            <div className="relative">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-input cursor-pointer"
                style={{ padding: '2px' }}
              />
            </div>
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 font-mono text-sm"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
