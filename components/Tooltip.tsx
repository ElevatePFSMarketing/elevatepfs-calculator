
import React from 'react';
import { QuestionMarkIcon } from './icons';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  return (
    <span className="relative group flex items-center justify-center ml-2">
      <QuestionMarkIcon className="h-4 w-4 text-summit-700" />
      <span className="absolute bottom-full mb-2 w-48 bg-foundation-800 text-white text-xs text-center rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foundation-800"></span>
      </span>
    </span>
  );
};

export default Tooltip;
