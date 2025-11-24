import React, { useEffect, useRef } from 'react';
import { User } from 'lucide-react';

const MentionDropdown = ({ members, onSelect, position, searchQuery }) => {
  const dropdownRef = useRef(null);

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    // Safety check - skip if member doesn't have required fields
    if (!member || !member.name) return false;

    const query = searchQuery.toLowerCase();
    const name = (member.name || '').toLowerCase();
    const email = (member.email || '').toLowerCase();

    return name.includes(query) || email.includes(query);
  });

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onSelect(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onSelect]);

  if (filteredMembers.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg max-h-64 overflow-y-auto z-50"
      style={{
        maxHeight: '256px',
      }}
    >
      <div className="py-1">
        {filteredMembers.map((member) => (
          <button
            key={member._id}
            onClick={() => onSelect(member)}
            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-gray-900 dark:text-neutral-100 truncate">
                {member.name}
              </div>
              {member.email && (
                <div className="text-[12px] text-gray-500 dark:text-neutral-400 truncate">
                  {member.email}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MentionDropdown;
