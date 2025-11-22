import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Search, X } from 'lucide-react';
import * as Icons from 'lucide-react';

// Popular icons for categories - only include icons that actually exist
const ALL_ICON_NAMES = [
  'Folder', 'FolderOpen', 'FileText', 'File',
  'Bookmark', 'BookmarkPlus', 'Star', 'Heart', 'Tag',
  'Briefcase', 'Building', 'Home', 'GraduationCap', 'Coffee',
  'Code', 'Terminal', 'Database', 'Server', 'Cloud', 'Cpu',
  'Package', 'Box', 'Archive', 'Inbox', 'Mail', 'Send',
  'ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'TrendingUp', 'PieChart',
  'Music', 'Video', 'Film', 'Camera', 'Image', 'Palette',
  'Book', 'BookOpen', 'Newspaper', 'PenTool',
  'Calendar', 'Clock', 'Timer', 'Bell',
  'Zap', 'Flame', 'Sun', 'Moon', 'Sparkles',
  'Globe', 'MapPin', 'Map', 'Navigation', 'Compass', 'Plane',
  'Users', 'User', 'UserPlus', 'UserCheck', 'Shield', 'Lock',
  'Settings', 'Tool', 'Wrench', 'Hammer', 'Sliders',
  'Target', 'Award', 'Trophy', 'Flag', 'Rocket',
];

// Filter to only include icons that exist in lucide-react
const CATEGORY_ICONS = ALL_ICON_NAMES.filter(iconName => Icons[iconName] !== undefined);

const IconPicker = ({ value = 'Folder', onChange, label = 'Icon' }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = CATEGORY_ICONS.filter((iconName) =>
    iconName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const IconComponent = Icons[value] || Icons.Folder;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-card-foreground">
        {label}
      </Label>

      {/* Current Icon Display */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Selected Icon</p>
          <p className="text-xs text-muted-foreground">{value}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-9 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Icons Grid */}
      <div className="max-h-[300px] overflow-y-auto border border-border rounded-lg p-2">
        <div className="grid grid-cols-8 gap-1">
          {filteredIcons.map((iconName) => {
            const Icon = Icons[iconName];
            const isSelected = value === iconName;

            // Skip if icon doesn't exist
            if (!Icon) return null;

            return (
              <button
                key={iconName}
                type="button"
                onClick={() => onChange(iconName)}
                className={`p-2.5 rounded-lg transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={iconName}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No icons found</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredIcons.length} {filteredIcons.length === 1 ? 'icon' : 'icons'} available
      </p>
    </div>
  );
};

export default IconPicker;
