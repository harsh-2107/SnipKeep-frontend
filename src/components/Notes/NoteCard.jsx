import { useState } from 'react';
import { useNoteContext } from '../../context/NoteContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo, faThumbtack, faFileArchive, faTrash, faThumbTackSlash } from '@fortawesome/free-solid-svg-icons';
import MarkdownRenderer from '../MarkdownRenderer';
import Confirm from '../Confirm';

const NoteCard = ({ note }) => {
  const { onPin, onArchive, onDelete, permanentDelete, openEditModal } = useNoteContext();
  const [showConfirm, setShowConfirm] = useState(false);

  // Handle permanent deletion of a note (after successful confirmation)
  const handlePermanentDelete = async (result) => {
    setShowConfirm(false);
    if (result) {
      await permanentDelete(note);
    }
  }

  return (
    <>
      <div className="max-w-xs px-3 py-3 cursor-pointer bg-white border border-gray-200 rounded-lg hover:shadow-sm/20 dark:bg-gray-700 dark:border-gray-500 dark:hover:shadow-md/10 dark:hover:shadow-white flex flex-col justify-between select-none max-h-[620px]" onClick={() => openEditModal(note)}>
        <div className="flex flex-col overflow-hidden flex-grow">
          <h4 className={`${note.title ? "" : "hidden"} mb-2 text-xl font-semibold tracking-tight text-gray-800 dark:text-purple-200 line-clamp-3 flex-shrink-0`}>
            {note.title}
          </h4>
          <div className="font-normal mb-3 rounded-md text-gray-700 dark:text-gray-400 max-w-full overflow-hidden flex-grow">
            <MarkdownRenderer markdownContent={note.content} />
          </div>
          <div className={`${note.tag.length === 0 ? "hidden" : ""} flex mt-1 mb-2 gap-2 flex-wrap`}>
            {note.tag.map(t => {
              return <div key={t} className="px-2 py-0.5 text-sm rounded-full bg-purple-100 dark:bg-purple-300">{t}</div>
            })}
          </div>
        </div>
        <div className="flex items-center bottom-0">
          {!note.isDeleted ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onPin(note); }} className={`text-gray-700 hover:bg-gray-300 mr-2 rounded-full dark:text-white dark:hover:bg-gray-800 cursor-pointer ${note.isPinned ? "px-1.5 py-1" : "px-2.5 py-1"}`}>
                {note.isPinned ? <FontAwesomeIcon icon={faThumbTackSlash} /> : <FontAwesomeIcon icon={faThumbtack} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onArchive(note); }} className="px-2.5 py-1 text-gray-700 hover:bg-gray-300 mr-2 rounded-full dark:text-white dark:hover:bg-gray-800 cursor-pointer"><FontAwesomeIcon icon={faFileArchive} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(note); }} className="px-2.5 py-1 text-gray-700 hover:bg-gray-300 rounded-full dark:text-white dark:hover:bg-gray-800 cursor-pointer"><FontAwesomeIcon icon={faTrash} /></button>
            </>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); onDelete(note); }} className="px-2.5 py-1 text-gray-700 hover:bg-gray-300 mr-2 rounded-full dark:text-white dark:hover:bg-gray-800 cursor-pointer"><FontAwesomeIcon icon={faUndo} /></button>
              <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }} className="px-2.5 py-1 text-gray-700 hover:bg-gray-300 rounded-full dark:text-white dark:hover:bg-gray-800 cursor-pointer"><FontAwesomeIcon icon={faTrash} /></button>
            </>
          )}
        </div>
      </div>

      {showConfirm && <Confirm onClose={handlePermanentDelete} />}

    </>
  )
}

export default NoteCard;