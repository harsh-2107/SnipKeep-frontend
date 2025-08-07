import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNoteContext } from '../../context/NoteContext';
import { useSidebarContext } from '../../context/SidebarContext';
import { useViewModeContext } from '../../context/ViewModeContext';
import Header from '../Header';
import NoteView from './NoteView';
import Alert from '../Alert';
import Grid from '../Grid';

const Search = () => {
  const { searchedNotes, selectedNote, isModalOpen, setModalOpen, alertMessage, setOpenDropdownNoteId, setDropdownType } = useNoteContext();
  const { viewMode } = useViewModeContext();
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [unarchivedNotes, setUnarchivedNotes] = useState([]);
  const { sidebarOpen } = useSidebarContext();
  const [hasSearched, setHasSearched] = useState(false);
  const location = useLocation();

  // Sync the text query parameter of the url and searchText
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const textQuery = params.get('text') && decodeURIComponent(params.get('text'));
    setHasSearched(textQuery !== null && textQuery?.trim() !== "" ? true : false)
  }, [location.search])

  // Update the archivedNotes state when searchedNotes state changes
  useEffect(() => {
    setArchivedNotes(searchedNotes.filter(note => note.isArchived && note));
    setUnarchivedNotes(searchedNotes.filter(note => !note.isDeleted && !note.isArchived && note)); 5
  }, [searchedNotes])

  return (
    <>
      <Header />

      <div className={`bg-transparent pt-18 lg:pt-25 z-0 mx-auto pr-6 sm:pr-4 md:pr-4 xl:pr-8 mb-5 ${sidebarOpen ? "pl-20 md:pl-68 xl:pl-72 2xl:pl-70" : "pl-20 md:pl-20 xl:pl-20 2xl:pl-25"}`} onClick={() => {setOpenDropdownNoteId(null); setDropdownType("")}}>
        {hasSearched ?
          (searchedNotes.length === 0 ? (
            // Display this message if no notes are present
            <div className="flex justify-center items-center h-64 text-gray-700 dark:text-gray-400 text-xl font-semibold">
              No matching results.
            </div>
          ) : (
            <>
              <Grid notes={unarchivedNotes} />
              {archivedNotes.length !== 0 &&
                <>
                  <h1 className={`text-xl mt-10 mb-4 dark:text-white font-semibold ${viewMode === 'list' && "max-w-2xl mx-auto"}`}>ARCHIVED</h1>
                  <Grid notes={archivedNotes} />
                </>
              }
            </>
          )) :
          (<div className="flex justify-center items-center h-64 text-gray-700 dark:text-gray-400 text-2xl font-semibold">
            Search notes
          </div>
          )}
      </div>

      {alertMessage && <Alert text={alertMessage} color="purple" />}

      <NoteView
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        note={selectedNote}
      />
    </>
  )
}

export default Search;