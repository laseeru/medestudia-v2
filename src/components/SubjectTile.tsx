import React from 'react';
import { cn } from '@/lib/utils';

interface SubjectTileProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'preclinical' | 'clinical';
}

const SubjectTile: React.FC<SubjectTileProps> = ({
  title,
  icon,
  onClick,
  variant = 'preclinical',
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200",
        "hover:shadow-card hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2",
        "bg-card min-h-[140px]",
        variant === 'preclinical' && [
          "border-border hover:border-academic focus:ring-academic",
        ],
        variant === 'clinical' && [
          "border-border hover:border-academic focus:ring-academic",
        ]
      )}
    >
      <div 
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg mb-3 transition-colors duration-200",
          variant === 'preclinical' && "bg-academic/10 text-academic group-hover:bg-academic group-hover:text-white",
          variant === 'clinical' && "bg-academic/10 text-academic group-hover:bg-academic group-hover:text-white"
        )}
      >
        {icon}
      </div>
      
      <span className="text-sm font-medium text-center text-foreground leading-tight">
        {title}
      </span>
    </button>
  );
};

export default SubjectTile;
