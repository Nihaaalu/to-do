import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface SearchableTimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export const SearchableTimezoneSelector: React.FC<SearchableTimezoneSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Retrieve browser IANA timezones
  const [timezones, setTimezones] = useState<string[]>([]);

  useEffect(() => {
    let list: string[] = [];
    try {
      list = Intl.supportedValuesOf('timeZone');
    } catch (e) {
      list = [
        'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
        'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
        'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City',
        'America/New_York', 'America/Phoenix', 'America/Sao_Paulo', 'Asia/Bangkok',
        'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Kolkata',
        'Asia/Seoul', 'Asia/Singapore', 'Asia/Tokyo', 'Atlantic/Azores', 'Australia/Adelaide',
        'Australia/Brisbane', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
        'Europe/Berlin', 'Europe/Brussels', 'Europe/London', 'Europe/Madrid', 'Europe/Moscow',
        'Europe/Paris', 'Europe/Rome', 'Pacific/Auckland', 'Pacific/Chatham', 'Pacific/Fiji',
        'Pacific/Honolulu', 'UTC'
      ];
    }
    setTimezones(list);
  }, []);

  // Filter and group timezones
  const getFilteredAndGrouped = () => {
    const filtered = timezones.filter(tz => 
      tz.toLowerCase().includes(search.toLowerCase())
    );

    // Grouping
    const groups: { [region: string]: string[] } = {};
    filtered.forEach(tz => {
      const parts = tz.split('/');
      const region = parts.length > 1 ? parts[0] : 'Global';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(tz);
    });

    // Sort regions alphabetically but place 'Global' or 'UTC' nicely
    const sortedRegions = Object.keys(groups).sort((a, b) => {
      if (a === 'Global') return 1;
      if (b === 'Global') return -1;
      return a.localeCompare(b);
    });

    // Generate flattened list with type for keyboard navigation (to skip header lines)
    const items: Array<{ type: 'header' | 'item'; val: string; displayLabel: string; region: string }> = [];
    sortedRegions.forEach(region => {
      items.push({ type: 'header', val: region, displayLabel: region, region });
      // Sort timezones inside region
      const sortedTzs = groups[region].sort((a, b) => a.localeCompare(b));
      sortedTzs.forEach(tz => {
        const parts = tz.split('/');
        const displayLabel = parts.length > 1 ? parts.slice(1).join('/').replace(/_/g, ' ') : tz;
        items.push({ type: 'item', val: tz, displayLabel, region });
      });
    });

    return items;
  };

  const allItems = getFilteredAndGrouped();
  const selectableItems = allItems.filter(item => item.type === 'item');

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && isOpen && selectableItems[activeIndex]) {
      const activeValue = selectableItems[activeIndex].val;
      // Find the child element that has data-val={activeValue}
      const childrenArr = Array.from(listRef.current.children) as HTMLElement[];
      const activeEl = childrenArr.find(el => el.getAttribute('data-val') === activeValue);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, selectableItems.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + selectableItems.length) % Math.max(1, selectableItems.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectableItems[activeIndex]) {
          onChange(selectableItems[activeIndex].val);
          setIsOpen(false);
          setSearch('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearch('');
        break;
      default:
        break;
    }
  };

  const getCleanLabel = (tzStr: string) => {
    if (!tzStr) return 'Select Timezone...';
    const parts = tzStr.split('/');
    if (parts.length > 1) {
      return `${parts[0]} - ${parts.slice(1).join('/').replace(/_/g, ' ')}`;
    }
    return tzStr;
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-72 select-none" onKeyDown={handleKeyDown}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/[0.015] border border-white/[0.05] hover:bg-white/[0.03] rounded-xl sm:rounded-sm px-3.5 h-12 sm:h-8 text-sm sm:text-xs text-white/80 flex items-center justify-between cursor-pointer focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all font-mono"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getCleanLabel(value)}</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0 ml-1" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-full bg-[#0D0D0E] border border-white/[0.08] rounded-sm shadow-xl flex flex-col max-h-60 overflow-hidden animate-fadeIn">
          {/* Search Box */}
          <div className="relative p-1.5 border-b border-white/[0.05] flex items-center h-8.5 shrink-0">
            <Search className="absolute left-3 w-3 h-3 text-white/30" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search timezone..."
              className="w-full h-full bg-white/[0.02] border border-transparent rounded-sm pl-7 pr-3 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.08]"
            />
          </div>

          {/* Option list */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/5">
            {allItems.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-white/40">
                No timezone found
              </div>
            ) : (
              allItems.map((item, index) => {
                if (item.type === 'header') {
                  return (
                    <div
                      key={`header-${item.val}`}
                      className="px-3 py-1.5 text-[9px] font-bold text-[#7C5CFF] uppercase tracking-widest bg-white/[0.01] select-none sticky top-0 border-b border-white/[0.02] mt-1"
                    >
                      {item.displayLabel}
                    </div>
                  );
                }

                const isSelected = item.val === value;
                const selectedSelectableIndex = selectableItems.findIndex(si => si.val === item.val);
                const isActive = selectedSelectableIndex === activeIndex;

                return (
                  <div
                    key={`item-${item.val}`}
                    data-val={item.val}
                    onClick={() => {
                      onChange(item.val);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-4 py-1.5 flex items-center justify-between cursor-pointer text-xs font-mono transition-colors select-none ${
                      isActive ? 'bg-white/[0.06] text-white' : 'text-white/70 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className={`${isSelected ? 'font-semibold text-white' : ''} truncate`}>
                      {item.displayLabel}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#7C5CFF] shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
