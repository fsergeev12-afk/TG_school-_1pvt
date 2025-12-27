import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`relative ${isDragging ? 'shadow-lg scale-[1.01] bg-[var(--tg-theme-bg-color)] rounded-xl' : ''} transition-all`}>
        {/* Drag Handle - понятная иконка "перетащить" */}
        <div
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab active:cursor-grabbing text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)] active:text-[var(--tg-theme-button-color)] z-10 touch-manipulation"
        >
          {/* Hamburger / Move icon - более понятная иконка */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="8" x2="20" y2="8" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="16" x2="20" y2="16" />
          </svg>
        </div>
        {/* Content with padding for handle */}
        <div className="pl-10">
          {children}
        </div>
      </div>
    </div>
  );
};

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: SortableListProps<T>) {
  // Быстрый отклик для drag-n-drop (distance: 3 вместо 8)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Быстрее реагирует на drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Короткая задержка для touch
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

