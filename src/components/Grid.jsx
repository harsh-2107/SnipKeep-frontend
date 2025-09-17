import { useState, useEffect, useMemo } from 'react';
import { useViewModeContext } from '../context/ViewModeContext';
import { useSidebarContext } from '../context/SidebarContext';
import NoteCard from './Notes/NoteCard';
import './Grid.css'

const Grid = ({ notes, onRequestPermanentDelete }) => {
  const { viewMode } = useViewModeContext();
  const { sidebarOpen } = useSidebarContext();

  // Memoize note cards
  const noteCards = useMemo(() => {
    return notes.map((note) => (
      <NoteCard 
        key={note._id} 
        note={note}
        viewMode={viewMode} 
        onRequestPermanentDelete={onRequestPermanentDelete} 
      />
    ));
  }, [notes, viewMode, onRequestPermanentDelete]);

  if (viewMode === 'list') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {noteCards}
      </div>
    );
  }

  return (
    <div className={`mx-auto grid gap-4 transition-all duration-500 ${
      sidebarOpen
        ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
    }`}>
      {noteCards}
    </div>
  );
};

export default Grid;