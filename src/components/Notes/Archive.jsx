import { useNoteContext } from '../../context/NoteContext';
import { useSidebarContext } from '../../context/SidebarContext';
import Header from '../Header';
import NoteView from './NoteView';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';
import Grid from '../Grid';

const Archive = () => {
  const { archivedNotes, selectedNote, isModalOpen, setModalOpen, loading, alertMessage, setOpenDropdownNoteId, setDropdownType } = useNoteContext();
  const { sidebarOpen } = useSidebarContext();

  return (
    <>
      <Header />

      <div className={`bg-transparent min-h-[97vh] pt-18 lg:pt-25 z-0 mx-auto pr-6 sm:pr-4 md:pr-4 xl:pr-8 mb-5 ${sidebarOpen ? "pl-20 md:pl-68 xl:pl-72 2xl:pl-70" : "pl-20 md:pl-20 xl:pl-20 2xl:pl-25"}`} onClick={() => {setOpenDropdownNoteId(null); setDropdownType("")}}>
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
              <Grid notes={archivedNotes} />
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