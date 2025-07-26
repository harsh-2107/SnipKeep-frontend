import { useState, useEffect, useRef } from "react";
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

  const titleRef = useRef(null);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const isSyncingRef = useRef(false);

  let markdownContent = watch("content");
  let formTitle = watch("title");
  let isPinned = watch("isPinned");
  let isArchived = watch("isArchived");
  let isDeleted = watch("isDeleted");

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
      titleRef.current.focus();
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

  // Sync scroll between textarea and preview in both directions
  const syncScroll = (sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;
    const source = sourceRef.current;
    const target = targetRef.current;
    const ratio = source.scrollTop / (source.scrollHeight - source.clientHeight);
    target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
  };

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
  };

  // Validate that either title or content has text
  const validateTitleOrContent = () => {
    // Check if either title or content (from RHF's watch) has non-empty, non-whitespace content
    if (!formTitle?.trim() && !markdownContent?.trim()) {
      return "Note must contain a title or markdown.";
    }
    return true;
  };

  // Handle note submission (new note or update existing)
  const handleFormSubmit = async (data) => {
    const validationResult = validateTitleOrContent();
    if (validationResult !== true) {
      setAlertMessage(validationResult);
      return;
    }
    setAlertMessage("");

    const newNote = {
      title: data.title,
      content: data.content,
      tag: [...(data.tag || [])],
      isPinned: isPinned,
      isArchived: isArchived,
      isDeleted: isDeleted,
      updatedAt: new Date().toISOString(),
      createdAt: note?.createdAt || new Date().toISOString()
    };

    if (note?._id) {
      await editNote({ ...newNote, _id: note._id });
    } else {
      await addNote(newNote);
    }
    clearForm();
    onClose();
  };

  // Handle permanent deletion of a note (after successful confirmation)
  const handlePermanentDelete = async (result) => {
    setShowConfirm(false);
    if (result) {
      await permanentDelete(note);
      clearForm();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-center items-center bg-[#3130308c]">
        {/* Modal */}
        <div className="relative p-2 sm:p-4 w-full rounded-xl max-w-[95vw] lg:max-w-[90vw] bg-white dark:bg-gray-800">
          {/* Grid */}
          <div className="sm:grid sm:grid-cols-2 sm:gap-3">
            {/* Title and Markdown input form */}
            <form id="note-form" onSubmit={handleSubmit(handleFormSubmit)} className={`bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-y-auto max-h-[85vh] 
              ${showMarkdown ? "hidden sm:block" : ""}`}>
              <div className="flex items-center justify-between p-2 border-b dark:border-gray-600 border-gray-200">
                <input
                  {...register("title")}
                  ref={(e) => { register("title").ref(e); titleRef.current = e; }}
                  placeholder="Title"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                        textareaRef.current.setSelectionRange(0, 0);
                        textareaRef.current.scrollTop = 0;
                      }
                    }
                  }} className="border-gray-300 text-gray-900 text-2xl rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500 outline-none transition-colors"
                />
              </div>
              <div className="p-2 h-[77vh] space-y-4 text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                <textarea
                  {...register("content")}
                  ref={(e) => { register("content").ref(e); textareaRef.current = e; }}
                  onScroll={() => {
                    if (isSyncingRef.current) return;
                    isSyncingRef.current = true;
                    syncScroll(textareaRef, previewRef);
                    setTimeout(() => { isSyncingRef.current = false; }, 10);
                  }}
                  placeholder="Markdown"
                  autoComplete="off"
                  className="h-full resize-none border-gray-300 text-gray-900 text-md lg:text-lg rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </form>
            {/* Markdown */}
            <div className={`bg-zinc-50 border border-gray-100 dark:border-0 dark:bg-gray-900 rounded-lg shadow-sm max-h-[85vh] ${showMarkdown ? "h-[85vh] w-full" : "hidden sm:block"}`}>
              <div ref={previewRef}
                onScroll={() => {
                  if (isSyncingRef.current) return;
                  isSyncingRef.current = true;
                  syncScroll(previewRef, textareaRef);
                  setTimeout(() => { isSyncingRef.current = false; }, 10);
                }} className="p-4 overflow-y-auto max-w-full h-full text-gray-700 dark:text-gray-200">
                <MarkdownRenderer markdownContent={markdownContent} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 sm:gap-5">
              {/* Add tag button and dropdown menu */}
              <div className="relative">
                {/* Dropdown button */}
                <button type="button" onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center bg-purple-100 hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 text-gray-700 dark:text-white hover:text-white px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-full cursor-pointer">
                  <FontAwesomeIcon icon={faTag} className="text-lg rotate-[135deg] sm:mr-2" /><span className="text-sm font-semibold hidden sm:block">Add Label</span>
                </button>

                {/* Dropdown menu */}
                <div className={`${showDropdown ? "absolute" : "hidden"} z-50 bottom-0 left-9 sm:left-32 w-60 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 space-y-2 max-h-64 overflow-y-auto`}>
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
                {!isDeleted ? (
                  <>
                    <button onClick={() => {
                      if (isPinned) { isPinned = false }
                      else { isPinned = true; isArchived = false; isDeleted = false; }
                    }} className={`py-1.5 sm:py-2 text-sm sm:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer ${note?.isPinned ? "px-2 sm:px-2.5" : "px-2.5 sm:px-3.5"}`} type="submit" form="note-form" disabled={isSubmitting}>
                      {note?.isPinned ? <FontAwesomeIcon icon={faThumbtackSlash} /> : <FontAwesomeIcon icon={faThumbtack} />}
                    </button>
                    <button onClick={() => {
                      if (isArchived) { isArchived = false }
                      else { isPinned = false; isArchived = true; isDeleted = false; }
                    }} className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-sm sm:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>
                      <FontAwesomeIcon icon={faFileArchive} /></button>
                    {note && <button onClick={() => { isPinned = false; isArchived = false; isDeleted = true; }} className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-sm sm:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white rounded-full dark:text-white dark:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}><FontAwesomeIcon icon={faTrash} /></button>}
                  </>
                ) : (
                  <>
                    <button onClick={() => { isPinned = false; isArchived = false; isDeleted = false; }} className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-sm sm:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}><FontAwesomeIcon icon={faUndo} /></button>
                    <button onClick={() => setShowConfirm(true)}
                      className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-sm sm:text-xl text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white rounded-full dark:text-white dark:bg-gray-700 cursor-pointer"><FontAwesomeIcon icon={faTrash} /></button>
                  </>
                )}
                {/* Toggle between form and markdown in small screen */}
                <button onClick={() => setShowMarkdown(!showMarkdown)} className={`ml-1.5 py-1 sm:py-2 text-base text-gray-600 bg-purple-100 hover:bg-purple-500 hover:text-white mr-1.5 sm:mr-3 rounded-full dark:text-white dark:bg-gray-700 cursor-pointer sm:hidden ${showMarkdown ? "px-[0.42rem]" : "px-2"}`}>
                  {showMarkdown ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                </button>
              </div>
            </div>
            {/* Created/Edited date and time, Save and Cancel buttons */}
            <div className="flex items-center gap-1 sm:gap-3">
              {note && <div className="md:flex items-center hidden text-sm dark:text-white cursor-default">
                <p className="font-medium mr-1">{note.createdAt === note.updatedAt ? "Created:" : "Edited:"}</p>
                <p>{new Date(note.updatedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}</p>
              </div>}
              <button className="flex items-center justify-center font-semibold bg-purple-50 dark:bg-transparent hover:text-white text-gray-600 dark:text-white px-2 py-1 sm:px-5 sm:py-2 rounded-full hover:bg-purple-500 cursor-pointer" onClick={onClose}>Cancel</button>
              <button className="flex items-center justify-center font-semibold bg-purple-50 dark:bg-transparent hover:text-white text-purple-600 dark:text-white px-2 py-1 sm:px-5 sm:py-2 rounded-full hover:bg-purple-500 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>Save</button>
            </div>
          </div>
          {/* Display Created/Edited date and time in small screen */}
          {note && <div className="flex items-center justify-end md:hidden text-xs dark:text-white mt-1 mr-2 cursor-default">
            <p className="font-medium mr-1">{note.createdAt === note.updatedAt ? "Created:" : "Edited:"}</p>
            <p>{new Date(note.updatedAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short"
            })}</p>
          </div>}
        </div>
      </div>

      {alertMessage && <Alert text={alertMessage} color="red" setAlertMessage={setAlertMessage} />}

      {showConfirm && <Confirm onClose={handlePermanentDelete} />}
    </>
  );
};

export default NoteView;