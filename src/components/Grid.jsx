import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useViewModeContext } from '../context/ViewModeContext';
import { useNoteContext } from '../context/NoteContext';
import { useSidebarContext } from '../context/SidebarContext';
import NoteCard from './Notes/NoteCard';
import Masonry from 'react-masonry-css';
import './Grid.css'

const Grid = ({ notes, category = "regular", onRequestPermanentDelete }) => {
  const { viewMode } = useViewModeContext();
  const { reorderNotes } = useNoteContext();
  const { sidebarOpen } = useSidebarContext();
  const location = useLocation();
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [orderedNotes, setOrderedNotes] = useState([]);

  const autoScrollIntervalRef = useRef(null);

  // Check if reordering should be disabled
  const isReorderingDisabled = useMemo(() => {
    const currentPath = location.pathname;
    const isTrashPage = currentPath === '/trash' || currentPath === '/bin';
    const isSearchPage = currentPath === '/search';
    const isDeletedCategory = category === 'deleted';
    return isTrashPage || isSearchPage || isDeletedCategory;
  }, [location.pathname, category]);

  // Sort notes by order field (ascending)
  useEffect(() => {
    const sortedNotes = [...notes].sort((a, b) => (a.order || 0) - (b.order || 0));
    setOrderedNotes(sortedNotes);
  }, [notes]);

  // Breakpoint configuration for responsive columns
  const breakpointColumnsObj = useMemo(() => {
    if (viewMode === 'list') return { default: 1 };
    const columnReduction = sidebarOpen ? 1 : 0;
    return {
      default: Math.max(7 - columnReduction, 1),
      1900: Math.max(6 - columnReduction, 1),
      1500: Math.max(5 - columnReduction, 1),
      1200: Math.max(4 - columnReduction, 1),
      900: Math.max(3 - columnReduction, 1),
      700: Math.max(2 - columnReduction, 1),
      600: 1
    };
  }, [viewMode, sidebarOpen]);

  // Auto-scroll functionality for drag operations
  const startAutoScroll = useCallback((clientY) => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
    const scrollZone = 100;
    const scrollSpeed = 15;
    const scrollInterval = 16;
    const viewportHeight = window.innerHeight;
    const distanceFromTop = clientY;
    const distanceFromBottom = viewportHeight - clientY;
    let scrollDirection = 0;
    if (distanceFromTop < scrollZone) {
      scrollDirection = -1;
    } else if (distanceFromBottom < scrollZone) {
      scrollDirection = 1;
    }
    if (scrollDirection !== 0) {
      autoScrollIntervalRef.current = setInterval(() => {
        const scrollAmount = scrollSpeed * scrollDirection;
        window.scrollBy(0, scrollAmount);
      }, scrollInterval);
    }
  }, []);

  // Stop auto scrolling
  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  // Drag and Drop Handlers
  const handleDragStart = useCallback((e, note, index) => {
    if (isReorderingDisabled) {
      e.preventDefault();
      return;
    }
    setDraggedItem({ note, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);

    document.body.style.cursor = 'move';
    e.target.style.cursor = 'move';

    const rect = e.target.getBoundingClientRect();

    const dragImage = e.target.cloneNode(true);

    const codeBlocks = dragImage.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      // Replace complex code blocks with simplified versions
      if (block.tagName === 'PRE') {
        const codeBlock = block.querySelector('code');
        if (codeBlock) {
          const fullCode = codeBlock.textContent || "";
          const limitedCode = fullCode.split('\n').slice(0, 15).join('\n');
          codeBlock.textContent = limitedCode;
        }
      } else if (block.tagName === 'CODE' && !block.closest('pre')) {
        block.style.contain = 'layout style';
      }
    });

    if (viewMode === 'list') {
      dragImage.style.width = `${rect.width}px`;
      dragImage.style.height = `${rect.height}px`;
    } else {
      // Keep original proportions for grid mode
      dragImage.style.width = `${rect.width}px`;
      dragImage.style.height = `${rect.height}px`;
    }

    document.body.appendChild(dragImage);

    e.dataTransfer.setDragImage(dragImage, 0, 0);

    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);

    e.target.style.opacity = '0';
  }, [isReorderingDisabled, viewMode]);

  const handleDragEnd = useCallback((e) => {
    if (isReorderingDisabled) return;

    stopAutoScroll();
    e.target.style.opacity = '1';
    e.target.style.cursor = 'default';
    document.body.style.cursor = 'default';

    setDraggedItem(null);
    setDragOverIndex(null);
  }, [isReorderingDisabled, stopAutoScroll]);

  const handleDragOver = useCallback((e) => {
    if (isReorderingDisabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.body.style.cursor = 'move';
    startAutoScroll(e.clientY);
  }, [isReorderingDisabled, startAutoScroll]);

  const handleDragEnter = useCallback((e, index) => {
    if (isReorderingDisabled) return;
    e.preventDefault();
    if (draggedItem && draggedItem.index !== index) {
      setDragOverIndex(index);
    }
  }, [draggedItem, isReorderingDisabled]);

  const handleDragLeave = useCallback((e) => {
    if (isReorderingDisabled) return;
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  }, [isReorderingDisabled]);

  const handleDrop = useCallback(async (e, dropIndex) => {
    if (isReorderingDisabled) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    e.preventDefault();
    stopAutoScroll();
    document.body.style.cursor = 'default';

    if (!draggedItem || draggedItem.index === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newOrderedNotes = [...orderedNotes];
    const [movedNote] = newOrderedNotes.splice(draggedItem.index, 1);
    newOrderedNotes.splice(dropIndex, 0, movedNote);

    const originalOrder = [...orderedNotes];

    // Update local state immediately for smooth UX
    setOrderedNotes(newOrderedNotes);
    setDraggedItem(null);
    setDragOverIndex(null);

    try {
      const success = await reorderNotes(newOrderedNotes, category);
      if (!success) {
        // Revert on failure
        setOrderedNotes(originalOrder);
      }
    } catch (error) {
      // Revert on error
      setOrderedNotes(originalOrder);
      console.error('Failed to reorder notes:', error);
    }
  }, [draggedItem, orderedNotes, category, reorderNotes, isReorderingDisabled, stopAutoScroll]);

  // Memoize note cards
  const noteCards = useMemo(() => {
    return orderedNotes.map((note, index) => {
      const isDragOver = !isReorderingDisabled && dragOverIndex === index;
      const isBeingDragged = !isReorderingDisabled && draggedItem?.index === index;

      return (
        <div
          key={note._id}
          className={`${viewMode === 'list' ? 'transition-all duration-200' : ''} ${isDragOver ? 'scale-103 transition-all opacity-95' : ''} 
          ${isReorderingDisabled ? 'cursor-default' : 'cursor-default hover:cursor-default'}`}
          style={{
            transformOrigin: 'center',
            willChange: isDragOver || isBeingDragged ? 'transform, opacity' : 'auto'
          }}
          draggable={!isReorderingDisabled}
          onDragStart={!isReorderingDisabled ? (e) => handleDragStart(e, note, index) : undefined}
          onDragEnd={!isReorderingDisabled ? handleDragEnd : undefined}
          onDragOver={!isReorderingDisabled ? handleDragOver : undefined}
          onDragEnter={!isReorderingDisabled ? (e) => handleDragEnter(e, index) : undefined}
          onDragLeave={!isReorderingDisabled ? handleDragLeave : undefined}
          onDrop={!isReorderingDisabled ? (e) => handleDrop(e, index) : undefined}
          title={isReorderingDisabled ? '' : 'Drag to reorder'}
        >
          <NoteCard note={note} viewMode={viewMode} onRequestPermanentDelete={onRequestPermanentDelete} />
        </div>
      );
    });
  }, [orderedNotes, viewMode, dragOverIndex, draggedItem, isReorderingDisabled, handleDragStart, handleDragEnd, handleDragOver, handleDragEnter, handleDragLeave, handleDrop, onRequestPermanentDelete]);

  if (viewMode === 'list') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {noteCards}
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="masonry-grid"
      columnClassName="masonry-grid-column"
    >
      {noteCards}
    </Masonry>
  );
};

export default Grid;