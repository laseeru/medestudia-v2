import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PathwayCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'preclinical' | 'clinical';
  onClick: () => void;
}

const PathwayCard: React.FC<PathwayCardProps> = ({
  title,
  description,
  icon,
  variant,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl border-2 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-offset-2",
        "min-h-[280px] md:min-h-[320px] w-full",
        variant === 'preclinical' && [
          "border-academic/30 bg-gradient-to-br from-academic-light/5 to-academic/10",
          "hover:border-academic hover:from-academic-light/10 hover:to-academic/20",
          "focus:ring-academic"
        ],
        variant === 'clinical' && [
          "border-medical/30 bg-gradient-to-br from-medical-light/5 to-medical/10",
          "hover:border-medical hover:from-medical-light/10 hover:to-medical/20",
          "focus:ring-medical"
        ]
      )}
    >
      <div 
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-2xl mb-6 transition-transform duration-300 group-hover:scale-110",
          variant === 'preclinical' && "gradient-academic text-white",
          variant === 'clinical' && "gradient-medical text-white"
        )}
      >
        {icon}
      </div>
      
      <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
        {title}
      </h2>
      
      <p className="text-muted-foreground text-center max-w-xs mb-6">
        {description}
      </p>
      
      <div 
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-all duration-300",
          "group-hover:gap-2",
          variant === 'preclinical' && "text-academic",
          variant === 'clinical' && "text-medical"
        )}
      >
        <span>Comenzar</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
};

export default PathwayCard;
