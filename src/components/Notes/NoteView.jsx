import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNoteContext } from "../../context/NoteContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faUndo, faThumbtack, faFileArchive, faTrash, faThumbtackSlash, faTag, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import MarkdownRenderer from "../MarkdownRenderer";
import Alert from "../Alert";
import Confirm from '../Confirm';

const NoteView = ({ note, isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    watch,
    reset,
    setValue
  } = useForm({
    defaultValues: {
      title: note?.title ?? '',
      content: note?.content ?? '',
      tag: note?.tag ?? [],
      isPinned: note?.isPinned ?? false,
      isArchived: note?.isArchived ?? false,
      isDeleted: note?.isDeleted ?? false
    },
  });

  const { addNote, editNote, permanentDelete } = useNoteContext();

  const [showDropdown, setShowDropdown] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [historyIndexState, setHistoryIndexState] = useState(0);

  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const previewRef = useRef(null);
  const isSyncingRef = useRef(false);
  const history = useRef(note?.content ? [{ content: note.content, cursor: 0, scrollTop: 0 }] : [{ content: "", cursor: 0, scrollTop: 0 }]);
  const historyIndex = useRef(0);
  const debounceTimer = useRef(null);
  const isInternalChange = useRef(false);
  const isArchivedNote = useRef(watch("isArchived") === true);
  const isDeletedNote = useRef(watch("isDeleted") === true);

  let formTitle = watch("title");
  let markdownContent = watch("content");
  let isPinned = watch("isPinned");

  // Effect to handle form reset and scroll lock when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        title: note?.title ?? '',
        content: note?.content ?? '',
        tag: note?.tag ?? [],
        isPinned: note?.isPinned ?? false,
        isArchived: note?.isArchived ?? false,
        isDeleted: note?.isDeleted ?? false
      });
      setAvailableTags([...(note?.tag ?? [])]);
      setNewTag("");
      setShowDropdown(false);
      setShowMarkdown(false);
      setAlertMessage("");
      isArchivedNote.current = watch("isArchived") === true;
      isDeletedNote.current = watch("isDeleted") === true;
      history.current = note?.content ? [{ content: note.content, cursor: 0, scrollTop: 0 }] : [{ content: "", cursor: 0, scrollTop: 0 }];
      historyIndex.current = 0;
      isInternalChange.current = false;
      setHistoryIndexState(0);
      requestAnimationFrame(() => {
        if (contentRef.current.value) {
          contentRef.current.focus();
          contentRef.current.setSelectionRange(0, 0);
          contentRef.current.scrollTop = 0;
        }
      });
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      clearForm();
      // Enable body scroll when modal is closed
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [note, isOpen]);

  // Effect to debounce content changes and push to history if modified
  useEffect(() => {
    // If the change came from undo/redo (internal change), skip recording history
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // Set a new debounce timer
    debounceTimer.current = setTimeout(() => {
      const currentContent = markdownContent;
      const lastRecordedState = history.current[historyIndex.current];
      // Only record if content has actually changed from the last recorded state
      if (lastRecordedState.content !== currentContent) {
        if (historyIndex.current < history.current.length - 1) {
          history.current.splice(historyIndex.current + 1);
        }
        // Capture current cursor and scroll position (after user input)
        const cursor = contentRef.current?.selectionStart ?? currentContent.length;
        const scrollTop = contentRef.current?.scrollTop ?? 0;
        // Add new state to history
        history.current.push({ content: currentContent, cursor, scrollTop });
        historyIndex.current = history.current.length - 1;
        setHistoryIndexState(historyIndex.current);
      }
    }, 300);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    }
  }, [markdownContent]);

  // Move one step back in history and restores content, cursor, scroll
  const handleUndo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      isInternalChange.current = true;
      const prevState = history.current[historyIndex.current];
      setHistoryIndexState(historyIndex.current);
      setValue("content", prevState.content);
      restoreCursorAndScroll(prevState.cursor, prevState.scrollTop);
    }
  }, [setValue]);

  // Moves one step forward in history and restores content, cursor, scroll
  const handleRedo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      isInternalChange.current = true;
      const nextState = history.current[historyIndex.current];
      setHistoryIndexState(historyIndex.current);
      setValue("content", nextState.content);
      restoreCursorAndScroll(nextState.cursor, nextState.scrollTop);
    }
  }, [setValue]);

  // Set cursor and scrollTop in textarea with smooth scroll
  const restoreCursorAndScroll = (cursor, scrollTop) => {
    requestAnimationFrame(() => {
      const textarea = contentRef.current;
      if (textarea) {
        textarea.focus();
        const cursorPosition = Math.min(cursor, textarea.value.length);
        textarea.setSelectionRange(cursorPosition, cursorPosition);
        textarea.classList.add("scroll-smooth");
        textarea.scrollTop = scrollTop ?? 0;
        textarea.classList.remove("scroll-smooth");
      }
    });
  }

  // Capture initial cursor and scrollTop set by the user in first history state
  const handleContentFocus = () => {
    if (note?.content === contentRef.current.value) {
      history.current[0].cursor = contentRef.current.selectionEnd;
      history.current[0].scrollTop = contentRef.current.scrollTop;
    }
  }

  // Sync scroll between textarea and preview in both directions based on scroll ratio
  const syncScroll = useCallback((sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;
    isSyncingRef.current = true;
    const source = sourceRef.current;
    const target = targetRef.current;
    const ratio = source.scrollTop / (source.scrollHeight - source.clientHeight);
    target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    requestAnimationFrame(() => isSyncingRef.current = false);
  }, []);

  // Handle title textarea size
  const handleTitleInput = () => {
    const textarea = titleRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }

  // Clear form data and UI state
  const clearForm = () => {
    reset({
      title: '',
      content: '',
      tag: [],
      isPinned: false,
      isArchived: false,
      isDeleted: false
    });
    setAvailableTags([]);
    setNewTag("");
    setAlertMessage("");
  }

  // Add a new tag to the dropdown
  const addNewTag = () => {
    if (newTag && !availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
      setNewTag("");
    }
  }

  // Check if 2 arrays are equal (to compare tag arrays)
  const areArraysEqual = useCallback((arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, index) => val === sorted2[index]);
  }, []);

  // Check if two note objects are equal (exclude updatedAt and id comparison)
  const areNotesEqual = useCallback((note1, note2) => {
    return note1.title === note2.title && note1.content === note2.content && areArraysEqual(note1.tag, note2.tag) &&
      note1.isPinned === note2.isPinned && note1.isArchived === note2.isArchived && note1.isDeleted === note2.isDeleted;
  }, [areArraysEqual]);

  // Handle note submission (new note or update existing)
  const handleFormSubmit = async (data) => {
    const isBlank = !formTitle?.trim() && !markdownContent?.trim();
    if (isBlank && !note) {
      onClose();
      return;
    }
    if (note && areNotesEqual(data, note)) {
      onClose();
      return;
    }
    const newNote = {
      title: data.title,
      content: data.content,
      tag: [...(data.tag || [])],
      isPinned: isBlank ? false : data.isPinned,
      isArchived: isBlank ? false : data.isArchived,
      isDeleted: isBlank ? true : data.isDeleted,
      updatedAt: new Date().toISOString()
    }
    if (note?._id) {
      await editNote({ ...newNote, _id: note._id });
    } else {
      await addNote(newNote);
    }
    clearForm();
    onClose();
  }

  // Handle permanent deletion of a note (after successful confirmation)
  const handlePermanentDelete = async (result) => {
    setShowConfirm(false);
    if (result) {
      await permanentDelete(note);
      clearForm();
      onClose();
    }
  }

  // Return a human-readable string describing how recently the note was edited
  const formatUpdatedAt = useCallback(() => {
    if (note) {
      const updatedAt = new Date(note.updatedAt);
      const diffSeconds = Math.floor((new Date() - updatedAt) / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffHours < 24) {
        return `Edited at ${updatedAt.toLocaleString("en-IN", { timeStyle: "short", hour12: false })}`;
      } else if (diffDays === 1) {
        return `Edited at yesterday, ${updatedAt.toLocaleString("en-IN", { timeStyle: "short", hour12: false })}`;
      } else {
        return `Edited at ${updatedAt.getFullYear() !== new Date().getFullYear() ? updatedAt.toLocaleString("en-IN", { dateStyle: "medium" }) : updatedAt.toLocaleString("en-IN", {
          day: "numeric",
          month: "short"
        })}`;
      }
    }
  }, [note?.updatedAt]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-center items-center bg-[#3130308c]" onMouseDown={handleSubmit(handleFormSubmit)}>
        {/* Modal */}
        <div className="relative p-2 sm:p-3 sm:pb-2.5 w-full sm:rounded-xl sm:max-w-[95vw] lg:max-w-[90vw] h-full sm:max-h-[95vh] bg-white dark:bg-gray-800 flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
          {/* Grid */}
          <div className="md:grid md:grid-cols-2 md:gap-3 flex-grow overflow-hidden">
            <form id="note-form" onSubmit={handleSubmit(handleFormSubmit)} className={`bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-0 shadow-sm overflow-y-auto h-full flex flex-col ${showMarkdown ? "hidden md:block" : ""}`}>
              <div className="flex items-center justify-between p-1 sm:p-2 border-b dark:border-gray-600 border-gray-200">
                <textarea
                  {...register("title")}
                  ref={(e) => { register("title").ref(e); titleRef.current = e; }}
                  placeholder="Title"
                  rows={1}
                  maxLength={150}
                  autoComplete="off"
                  onChange={handleTitleInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (contentRef.current) {
                        contentRef.current.focus();
                        contentRef.current.setSelectionRange(0, 0);
                        contentRef.current.scrollTop = 0;
                      }
                    }
                  }} className="text-gray-900 dark:text-white text-xl sm:text-2xl rounded-lg block w-full px-2 py-1 dark:bg-gray-700 dark:placeholder-gray-400 resize-none overflow-y-hidden outline-none transition-colors"
                />
              </div>
              <div className="p-1 pb-0 md:p-2 flex flex-col flex-grow text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                <textarea
                  {...register("content")}
                  ref={(e) => { register("content").ref(e); contentRef.current = e; }}
                  onScroll={() => {
                    if (isSyncingRef.current) return;
                    syncScroll(contentRef, previewRef);
                  }}
                  onClick={handleContentFocus}
                  placeholder="Markdown"
                  autoComplete="off"
                  className="flex-grow text-gray-800 dark:text-white text-sm sm:text-md lg:text-lg rounded-lg block w-full px-2 py-1 dark:bg-gray-700 dark:placeholder-gray-400 resize-none outline-none transition-colors"
                />
              </div>
              {/* Display Edited date and time in user readable format in small screen */}
              {note && <div className="flex items-center justify-end md:hidden text-[10px] text-gray-600 dark:text-white mr-1 cursor-default">
                {formatUpdatedAt()}
              </div>}
            </form>
            {/* Markdown */}
            <div className={`bg-zinc-50 border border-gray-200 dark:border-0 dark:bg-gray-900 py-2 rounded-lg shadow-sm h-full flex flex-col overflow-y-hidden ${showMarkdown ? "w-full" : "hidden md:flex"}`}>
              <div ref={previewRef}
                onScroll={() => {
                  if (isSyncingRef.current) return;
                  syncScroll(previewRef, contentRef);
                }}
                className="px-4 py-1 max-w-full overflow-auto h-fit flex-grow text-gray-700 dark:text-gray-200">
                <MarkdownRenderer markdownContent={markdownContent} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 sm:gap-5">
              {/* Add tag button and dropdown menu */}
              <div className="relative">
                {/* Dropdown button */}
                <button type="button" onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center bg-purple-100 hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 text-gray-700 dark:text-white hover:text-white px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-full cursor-pointer">
                  <FontAwesomeIcon icon={faTag} className="text-lg rotate-[135deg] sm:mr-2" /><span className="text-sm font-semibold hidden sm:block">Add Label</span>
                </button>

                {/* Dropdown menu */}
                <div className={`${showDropdown ? "absolute" : "hidden"} z-50 bottom-0 left-9 sm:left-32 w-60 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 sm:p-3 space-y-2 max-h-64 overflow-y-auto`}>
                  {/* Existing tags as checkboxes */}
                  {availableTags.map((tag, index) => (
                    <label key={index} className="flex items-center gap-2 text-sm text-gray-800 dark:text-white">
                      <input
                        type="checkbox"
                        value={tag}
                        defaultChecked={true}
                        {...register("tag")}
                        className="rounded accent-purple-600"
                      />
                      {tag}
                    </label>
                  ))}

                  {/* Add new tag section */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="New label"
                      className="flex-1 text-sm px-2 py-1 rounded-md outline-none border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      onKeyDown={(e) => { if (e.key === "Enter") addNewTag() }}
                    />
                    <button type="button" onClick={addNewTag} className="bg-purple-500 px-2 py-1 rounded-full hover:bg-purple-600"><FontAwesomeIcon icon={faAdd} className="text-xl text-white" /></button>
                  </div>
                </div>
              </div>
              {/* Pin, Archive, Delete Buttons */}
              <div className="flex items-center">
                {!isDeletedNote.current ? (
                  <>
                    <button onClick={() => {
                      if (isPinned) { setValue("isPinned", false) }
                      else { setValue("isPinned", true); setValue("isArchived", false); setValue("isDeleted", false); }
                    }} className={`py-1.5 sm:py-2 text-sm md:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer ${isPinned ? "px-2 sm:px-2.5" : "px-2.5 sm:px-[0.8rem] md:px-3.5"}`} disabled={isSubmitting}>
                      {isPinned ? <FontAwesomeIcon icon={faThumbtackSlash} /> : <FontAwesomeIcon icon={faThumbtack} />}
                    </button>
                    <button onClick={() => {
                      if (isArchivedNote.current) { setValue("isArchived", false) }
                      else { setValue("isPinned", false); setValue("isArchived", true); setValue("isDeleted", false); }
                    }} className="px-2.5 py-1.5 sm:px-3 md:px-3.5 sm:py-2 text-sm md:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>
                      <FontAwesomeIcon icon={faFileArchive} /></button>
                    {note && <button onClick={() => { setValue("isPinned", false); setValue("isArchived", false); setValue("isDeleted", true); }}
                      className="px-2.5 py-1.5 sm:px-3 md:px-3.5 sm:py-2 text-sm md:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white rounded-full dark:text-white dark:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}><FontAwesomeIcon icon={faTrash} /></button>}
                  </>
                ) : (
                  <>
                    <button onClick={() => { setValue("isPinned", false); setValue("isArchived", false); setValue("isDeleted", false); }}
                      className="px-2.5 py-1.5 sm:px-3 md:px-3.5 sm:py-2 text-sm md:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}><FontAwesomeIcon icon={faUndo} /></button>
                    <button onClick={() => setShowConfirm(true)}
                      className="px-2.5 py-1.5 sm:px-3 md:px-3.5 sm:py-2 text-sm md:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white rounded-full dark:text-white dark:bg-gray-700 cursor-pointer"><FontAwesomeIcon icon={faTrash} /></button>
                  </>
                )}
                {/* Toggle between form and markdown in small screen */}
                <button onClick={() => setShowMarkdown(!showMarkdown)} className={`ml-1.5 sm:ml-3 py-1 sm:py-1.5 md:py-2 text-base md:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer md:hidden ${showMarkdown ? "px-[0.42rem] sm:px-2" : "px-2 sm:px-[0.55rem]"}`}>
                  {showMarkdown ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                </button>
                {/* Undo/Redo buttons */}
                <div className="ml-2 sm:ml-8">
                  <button
                    onClick={handleUndo}
                    onMouseDown={(e) => {
                      if (historyIndexState === 0) {
                        e.preventDefault();
                        return false;
                      }
                    }}
                    tabIndex={historyIndexState === 0 ? -1 : 0}
                    className={`px-2.5 py-1.5 sm:px-3 md:px-3 sm:py-2.5 text-sm md:text-xl text-gray-600 rounded-full dark:text-white mr-0.5 sm:mr-6 ${historyIndexState === 0
                      ? "cursor-not-allowed opacity-50" : "hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 3.5 20 18.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="md:w-5.5 md:h-6 sm:w-4 sm:h-5 w-3 h-4 text-gray-600 dark:text-white">
                      <path d="M3 8h10a6 6 0 0 1 0 12H5.5" />
                      <polyline points="6.5 5.5 2 8 6.5 10.5" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRedo}
                    onMouseDown={(e) => {
                      if (historyIndexState === history.current.length - 1) {
                        e.preventDefault();
                        return false;
                      }
                    }}
                    tabIndex={historyIndexState === history.current.length - 1 ? -1 : 0}
                    className={`px-2.5 py-1.5 sm:px-3 md:px-3 sm:py-2.5 text-sm md:text-xl text-gray-600 rounded-full dark:text-white ${historyIndexState === history.current.length - 1 ? "cursor-not-allowed opacity-50" : "hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 3.5 20 18.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="md:w-5.5 md:h-6 sm:w-4 sm:h-5 w-3 h-4 text-gray-600 dark:text-white -scale-x-100">
                      <path d="M3 8h10a6 6 0 0 1 0 12H5.5" />
                      <polyline points="6.5 5.5 2 8 6.5 10.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {/* Display Edited date and time in user readable format, Close button */}
            <div className="flex items-center gap-1 sm:gap-3 mr-1">
              {note && <div className="md:flex items-center hidden text-[10px] md:text-[11.3px] lg:text-sm text-gray-600 dark:text-white cursor-default">
                <p className="mr-1">{formatUpdatedAt()}</p>
              </div>}
              <button className="flex items-center justify-center font-semibold bg-purple-50 dark:bg-transparent hover:text-white text-purple-600 dark:text-white px-2 py-1 sm:px-5 sm:py-2 rounded-full hover:bg-purple-500 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>Close</button>
            </div>
          </div>

        </div>
      </div>

      {alertMessage && <Alert text={alertMessage} color="red" setAlertMessage={setAlertMessage} />}

      {showConfirm && <Confirm onClose={handlePermanentDelete} />}
    </>
  );
};

export default NoteView;