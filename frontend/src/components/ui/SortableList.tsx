import React, { useCallback } from 'react';
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
    opacity: isDragging ? 0.95 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`relative ${isDragging ? 'shadow-xl scale-[1.02] bg-[var(--tg-theme-bg-color)] rounded-xl ring-2 ring-[var(--tg-theme-button-color)]' : ''} transition-all`}>
        {/* Drag Handle - БОЛЬШАЯ кнопка для мобилки */}
        <div
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
          style={{ touchAction: 'none' }} // Критично! Блокирует scroll при drag
        >
          {/* Крупная иконка перетаскивания */}
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--tg-theme-secondary-bg-color)] active:bg-[var(--tg-theme-button-color)] active:text-white transition-colors">
            <svg className="w-6 h-6 text-[var(--tg-theme-hint-color)]" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="5" width="16" height="2" rx="1" />
              <rect x="4" y="11" width="16" height="2" rx="1" />
              <rect x="4" y="17" width="16" height="2" rx="1" />
            </svg>
          </div>
        </div>
        {/* Content with padding for handle */}
        <div className="pl-14">
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
  // МГНОВЕННЫЙ отклик для drag-n-drop — БЕЗ delay!
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5, // Только distance, БЕЗ delay — мгновенный отклик
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Блокируем scroll страницы при начале drag
  const handleDragStart = useCallback(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }, []);

  // Возвращаем scroll после drag
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  }, [items, onReorder]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
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

