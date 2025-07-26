import { useNoteContext } from '../../context/NoteContext';
import { useUserContext } from '../../context/UserContext';
import { useSidebarContext } from '../../context/SidebarContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import DisplayHeader from '../DisplayHeader';
import NoteCard from './NoteCard';
import NoteView from './NoteView';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';

const Notes = () => {
  const { notes, pinnedNotes, selectedNote, openEditModal, isModalOpen, setModalOpen, loading, alertMessage } = useNoteContext();
  const { sidebarOpen } = useSidebarContext();
  const { name } = useUserContext();

  return (
    <>
      <DisplayHeader />

      <div className={`bg-transparent pt-18 lg:pt-25 z-0 transition-all max-w-screen-2xl w-full mx-auto pr-6 sm:pr-4 md:pr-4 xl:pr-8 2xl:pr-0 mb-5 ${sidebarOpen ? "pl-20 sm:pl-72 md:pl-68 xl:pl-72 2xl:pl-32" : "pl-20 sm:pl-20 md:pl-20 xl:pl-20 2xl:pl-0"}`}>
        {loading ?
          (<div className="flex items-center justify-center gap-4">
            <LoadingSpinner />
            <h1 className="text-3xl dark:text-white">Fetching notes...</h1>
          </div>)
          :
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h1 className="text-3xl sm:text-4xl font-bold dark:text-purple-300">Hi {name}!</h1>
              <button onClick={() => openEditModal()} className="flex items-center justify-center bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 cursor-pointer">
                <FontAwesomeIcon icon={faAdd} className="sm:text-xl text-white mr-2" />
                <span className="font-bold">Add Note</span>
              </button>
            </div>
            {pinnedNotes.length > 0 &&
              <>
                <h1 className="text-xl mb-2 dark:text-white font-semibold">PINNED</h1>
                <div className={`mx-auto grid gap-4 transition-all duration-500 ${sidebarOpen
                  ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                  }`}>
                  {pinnedNotes.map((note) => (
                    <NoteCard key={note._id} note={note} />
                  ))}
                </div>
                {notes.length > 0 &&
                  <h1 className="text-xl mt-10 mb-2 dark:text-white font-semibold">OTHERS</h1>
                }
              </>
            }
            {notes.length === 0 && pinnedNotes.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-700 dark:text-gray-400 text-2xl font-semibold">
                Notes is empty
              </div>
            ) : (
              <div className={`mx-auto grid gap-4 transition-all duration-500 ${sidebarOpen
                ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                }`}>
                {notes.map((note) => (
                  <NoteCard key={note._id} note={note} />
                ))}
              </div>
            )}
          </>
        }
      </div >

      {alertMessage && <Alert text={alertMessage} color="purple" />}

      <NoteView
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        note={selectedNote}
      />
    </>
  )
}

export default Notes;