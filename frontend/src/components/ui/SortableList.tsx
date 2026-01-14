import React, { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// restrictToVerticalAxis будем реализовывать через кастомный модификатор

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isDragOverlay?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, isDragOverlay }) => {
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
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  if (isDragOverlay) {
    return (
      <div className="relative shadow-2xl scale-105 bg-[var(--tg-theme-bg-color)] rounded-xl ring-2 ring-[var(--tg-theme-button-color)]">
        <div className="pl-14">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`relative ${isDragging ? 'invisible' : ''} transition-all`}>
        {/* Drag Handle - БОЛЬШАЯ кнопка для мобилки */}
        <div
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
          style={{ touchAction: 'none' }}
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
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // МГНОВЕННЫЙ отклик для drag-n-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Небольшая задержка чтобы отличить scroll от drag
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Блокируем скролл при начале drag (без position: fixed чтобы не ломать layout)
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    // Мягкая блокировка скролла - только overflow: hidden
    // НЕ используем position: fixed, чтобы не вызывать "сворачивание" интерфейса
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    
    // Вибрация для тактильного фидбека (если поддерживается)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  // Возвращаем scroll после drag
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Восстанавливаем скролл
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
    
    setActiveId(null);
    
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
      
      // Вибрация при успешном перемещении
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
  }, [items, onReorder]);

  const handleDragCancel = useCallback(() => {
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
    setActiveId(null);
  }, []);

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;
  const activeIndex = activeId ? items.findIndex(item => item.id === activeId) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
      
      {/* Drag Overlay - плавающий элемент при перетаскивании */}
      <DragOverlay>
        {activeItem ? (
          <SortableItem id={activeItem.id} isDragOverlay>
            {renderItem(activeItem, activeIndex)}
          </SortableItem>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
