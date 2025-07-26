import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNoteContext } from '../../context/NoteContext';
import { useSidebarContext } from '../../context/SidebarContext';
import DisplayHeader from '../DisplayHeader';
import NoteCard from './NoteCard';
import NoteView from './NoteView';
import Alert from '../Alert';

const Search = () => {
  const { searchedNotes, selectedNote, isModalOpen, setModalOpen, alertMessage } = useNoteContext();
  const [archivedNotes, setArchivedNotes] = useState([]);
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
  }, [searchedNotes])

  return (
    <>
      <DisplayHeader />

      <div className={`bg-transparent pt-18 lg:pt-25 z-0 transition-all max-w-screen-2xl w-full mx-auto pr-6 sm:pr-4 md:pr-4 xl:pr-8 2xl:pr-0 mb-5 ${sidebarOpen ? 'pl-20 sm:pl-72 md:pl-68 xl:pl-72 2xl:pl-32' : 'pl-20 sm:pl-20 md:pl-20 xl:pl-20 2xl:pl-0'}`}>
        {hasSearched ?
          (searchedNotes.length === 0 ? (
            // Display this message if no notes are present
            <div className="flex justify-center items-center h-64 text-gray-700 dark:text-gray-400 text-xl font-semibold">
              No matching results.
            </div>
          ) : (
            <>
              <div className={`mx-auto grid gap-4 transition-all duration-500 ${sidebarOpen
                ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                }`}>
                {searchedNotes.map((note) => (
                  !note.isArchived && <NoteCard key={note._id} note={note} />
                ))}
              </div>
              {archivedNotes.length !== 0 &&
                <>
                  <h1 className="text-xl mt-10 mb-2 dark:text-white font-semibold">ARCHIVED</h1>
                  <div className={`mx-auto grid gap-4 transition-all duration-500 ${sidebarOpen
                    ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                    }`}>
                    {archivedNotes.map((note) => (
                      <NoteCard key={note._id} note={note} />
                    ))}
                  </div>
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