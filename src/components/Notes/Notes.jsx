import { useNoteContext } from '../../context/NoteContext';
import { useUserContext } from '../../context/UserContext';
import { useSidebarContext } from '../../context/SidebarContext';
import { useViewModeContext } from '../../context/ViewModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import Header from '../Header';
import NoteView from './NoteView';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';
import Grid from '../Grid';

const Notes = () => {
  const { notes, pinnedNotes, selectedNote, openEditModal, isModalOpen, setModalOpen, loading, alertMessage, setOpenDropdownNoteId, setDropdownType } = useNoteContext();
  const { sidebarOpen } = useSidebarContext();
  const { viewMode } = useViewModeContext();
  const { name } = useUserContext();

  return (
    <>
      <Header />

      <div className={`bg-transparent pt-18 lg:pt-25 z-0 mx-auto pr-6 sm:pr-4 md:pr-4 xl:pr-8 mb-5 ${sidebarOpen ? "pl-20 md:pl-68 xl:pl-72 2xl:pl-70" : "pl-20 md:pl-20 xl:pl-20 2xl:pl-25"}`} onClick={() => {setOpenDropdownNoteId(null); setDropdownType("")}}>
        {loading ? (
          <div className="flex items-center justify-center gap-4">
            <LoadingSpinner />
            <h1 className="text-3xl dark:text-white">Fetching notes...</h1>
          </div>
        ) : (
          <>
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4 ${viewMode === 'list' && "max-w-2xl mx-auto"}`}>
              <h1 className="text-3xl sm:text-4xl font-bold dark:text-purple-300">Hi, {name}!</h1>
              <div className="flex items-center gap-3">
                {/* Add Note Button */}
                <button onClick={() => openEditModal()} className="flex items-center justify-center bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 transition-colors duration-200 cursor-pointer">
                  <FontAwesomeIcon icon={faAdd} className="sm:text-xl text-white mr-2" />
                  <span className="font-bold">Add Note</span>
                </button>
              </div>
            </div>

            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <>
                <h1 className={`text-xl mb-4 dark:text-white font-semibold ${viewMode === 'list' && "max-w-2xl mx-auto"}`}>PINNED</h1>
                <Grid notes={pinnedNotes} category="pinned" />
                {notes.length > 0 && (
                  <h1 className={`text-xl mt-10 mb-4 dark:text-white font-semibold ${viewMode === 'list' && "max-w-2xl mx-auto"}`}>OTHERS</h1>
                )}
              </>
            )}

            {/* Main Notes Section */}
            {notes.length === 0 && pinnedNotes.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-700 dark:text-gray-400 text-2xl font-semibold">
                Notes is empty
              </div>
            ) : (
              <Grid notes={notes} category="regular" />
            )}
          </>
        )}
      </div>

      {alertMessage && <Alert text={alertMessage} color="purple" />}

      <NoteView
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        note={selectedNote}
      />
    </>
  );
};

export default Notes;