'use client';

import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickEditModal } from '@/components/ui/QuickEditModal';
import { cn } from '@/lib/utils';

interface EditButtonProps {
  topicId: string;
  field: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    value: string;
    options?: string[];
  };
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  onUpdate?: (fieldId: string, value: string) => void;
}

export function EditButton({ 
  topicId, 
  field, 
  className = "", 
  size = "sm",
  variant = "ghost",
  onUpdate
}: EditButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = async (fieldId: string, value: string) => {
    const response = await fetch('/api/topics/quick-edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicId,
        fieldId,
        value,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update field');
    }

    const result = await response.json();
    
    // Call the onUpdate callback if provided
    if (onUpdate) {
      onUpdate(fieldId, value);
    }

    return result;
  };

  const sizeClasses = {
    sm: "h-6 w-6 p-0",
    default: "h-8 w-8 p-0", 
    lg: "h-10 w-10 p-0"
  };

  return (
    <div className="group/edit-btn inline-block">
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300",
          "bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 hover:bg-primary/5 hover:scale-110",
          sizeClasses[size],
          className
        )}
        title={`Edit ${field.label}`}
      >
        <Edit className="h-3 w-3 text-primary/70" />
      </Button>

      <QuickEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topicId={topicId}
        field={field}
        onSave={handleSave}
      />
    </div>
  );
}
