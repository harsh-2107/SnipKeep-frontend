import { useNoteContext } from '../../context/NoteContext';
import { useSidebarContext } from '../../context/SidebarContext';
import DisplayHeader from '../DisplayHeader';
import NoteCard from './NoteCard';
import NoteView from './NoteView';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';

const Archive = () => {
  const { archivedNotes, selectedNote, isModalOpen, setModalOpen, loading, alertMessage } = useNoteContext();
  const { sidebarOpen } = useSidebarContext();

  return (
    <>
      <DisplayHeader />

      <div className={`bg-transparent pt-18 lg:pt-25 z-0 transition-all max-w-screen-2xl w-full mx-auto pr-6 sm:pr-4 md:pr-4 xl:pr-8 2xl:pr-0 mb-5 ${sidebarOpen ? 'pl-20 sm:pl-72 md:pl-68 xl:pl-72 2xl:pl-32' : 'pl-20 sm:pl-20 md:pl-20 xl:pl-20 2xl:pl-0'}`}>
        {loading ?
          (<div className="flex items-center justify-center gap-4">
            <LoadingSpinner />
            <h1 className="text-3xl dark:text-white">Fetching notes...</h1>
          </div>)
          :
          <>
            {archivedNotes.length === 0 ? (
              // Display this message if no notes are present
              <div className="flex justify-center items-center h-64 text-gray-700 dark:text-gray-400 text-2xl font-semibold">
                Archive is empty
              </div>
            ) : (
              <div className={`mx-auto grid gap-4 transition-all duration-500 ${sidebarOpen
                ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                }`}>
                {archivedNotes.map((note) => (
                  <NoteCard key={note._id} note={note} />
                ))}
              </div>
            )}
          </>
        }
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

export default Archive;