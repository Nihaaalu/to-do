import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { countries, Country } from '../data/countries';

interface SearchableCountrySelectorProps {
  value: string;
  onChange: (countryName: string) => void;
}

export const SearchableCountrySelector: React.FC<SearchableCountrySelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Alphabetically sorted countries
  const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));

  // Filtered countries
  const filtered = sortedCountries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Find currently selected country
  const selectedCountry = sortedCountries.find(c => c.name === value) || sortedCountries.find(c => c.name === 'India');

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
      // Focus search input when dropdown opens
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
    if (listRef.current && isOpen) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
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
        setActiveIndex(prev => (prev + 1) % Math.max(1, filtered.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) {
          onChange(filtered[activeIndex].name);
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

  return (
    <div ref={containerRef} className="relative w-full sm:w-72 select-none" onKeyDown={handleKeyDown}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/[0.015] border border-white/[0.05] hover:bg-white/[0.03] rounded-xl sm:rounded-sm px-3.5 h-12 sm:h-8 text-sm sm:text-xs text-white flex items-center justify-between cursor-pointer focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-sm leading-none shrink-0">{selectedCountry.flag}</span>
              <span className="text-white/80 truncate">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-white/40">Select Country...</span>
          )}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0 ml-1" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-[#0D0D0E] border border-white/[0.08] rounded-sm shadow-xl flex flex-col max-h-60 overflow-hidden animate-fadeIn">
          {/* Search Box */}
          <div className="relative p-1.5 border-b border-white/[0.05] flex items-center h-8.5 shrink-0">
            <Search className="absolute left-3 w-3 h-3 text-white/30" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full h-full bg-white/[0.02] border border-transparent rounded-sm pl-7 pr-3 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.08]"
            />
          </div>

          {/* Option list */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/5">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-white/40">
                No country found
              </div>
            ) : (
              filtered.map((country, index) => {
                const isSelected = country.name === value;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={country.code}
                    onClick={() => {
                      onChange(country.name);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-3 py-1.5 flex items-center justify-between cursor-pointer text-xs transition-colors select-none ${
                      isActive ? 'bg-white/[0.06] text-white' : 'text-white/70 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-sm leading-none shrink-0">{country.flag}</span>
                      <span className={`${isSelected ? 'font-semibold text-white' : ''} truncate`}>
                        {country.name}
                      </span>
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
