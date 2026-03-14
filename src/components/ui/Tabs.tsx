'use client';

import { useState } from 'react';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export default function Tabs({ tabs, defaultTab, onChange, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key || '');

  const handleClick = (key: string) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div className={`flex gap-1 border-b border-neon-border ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            active === tab.key
              ? 'text-neon-primary-light'
              : 'text-neon-text-muted hover:text-neon-text'
          }`}
        >
          {tab.label}
          {active === tab.key && (
            <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-neon-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
