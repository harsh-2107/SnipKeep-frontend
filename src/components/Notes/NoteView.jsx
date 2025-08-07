import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNoteContext } from "../../context/NoteContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faUndo, faThumbtack, faFileArchive, faTrash, faThumbtackSlash, faTag, faEye, faEyeSlash, faPalette, faEllipsisV, faDropletSlash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import MarkdownRenderer from "../MarkdownRenderer";
import Alert from "../Alert";
import Confirm from '../Confirm';

const colourOptions = [
  { colour: "default", label: "Default", bgColour: "bg-transparent", borderColour: "border-gray-300 dark:border-gray-600" },
  { colour: "coral", label: "Coral", bgColour: "bg-[#faafa8]", borderColour: "border-[#faafa8]" },
  { colour: "peach", label: "Peach", bgColour: "bg-[#f39f76]", borderColour: "border-[#f39f76]" },
  { colour: "sand", label: "Sand", bgColour: "bg-[#fff8b8]", borderColour: "border-[#fff8b8]" },
  { colour: "mint", label: "Mint", bgColour: "bg-[#e2f6d3]", borderColour: "border-[#e2f6d3]" },
  { colour: "sage", label: "Sage", bgColour: "bg-[#b4ddd3]", borderColour: "border-[#b4ddd3]" },
  { colour: "fog", label: "Fog", bgColour: "bg-[#d4e4ed]", borderColour: "border-[#d4e4ed]" },
  { colour: "storm", label: "Storm", bgColour: "bg-[#aeccdc]", borderColour: "border-[#aeccdc]" },
  { colour: "dusk", label: "Dusk", bgColour: "bg-[#d3bfdb]", borderColour: "border-[#d3bfdb]" },
  { colour: "blossom", label: "Blossom", bgColour: "bg-[#f6e2dd]", borderColour: "border-[#f6e2dd]" },
  { colour: "clay", label: "Clay", bgColour: "bg-[#e9e3d4]", borderColour: "border-[#e9e3d4]" },
  { colour: "chalk", label: "Chalk", bgColour: "bg-[#efeff1]", borderColour: "border-[#efeff1]" }
];

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
      isDeleted: note?.isDeleted ?? false,
      colour: note?.colour ?? 'default'
    },
  });

  const { addNote, editNote, permanentDelete, makeNoteCopy, downloadMarkdown } = useNoteContext();

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showBgOptions, setShowBgOptions] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [historyIndexState, setHistoryIndexState] = useState(0);
  const [noteColour, setNoteColour] = useState(colourOptions.find(option => option.colour === watch("colour")));

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
  const mouseDownTarget = useRef(null);

  const moreOptions = useMemo(() => [
    { name: watch("tag").length === 0 ? "Add label" : "Change labels", onClick: () => { setShowMoreOptions(false); setShowTagDropdown(true); }, show: true },
    { name: "Make a copy", onClick: () => { handleSubmit(makeNoteCopy)(); setShowMoreOptions(false) }, show: note ? true : false },
    { name: "Download markdown", onClick: () => { downloadMarkdown(watch("title"), watch("content")); setShowMoreOptions(false) }, show: note ? true : false }
  ], [note, makeNoteCopy, downloadMarkdown, watch("title"), watch("content"), watch("tag")]);

  const markdownContent = watch("content");
  const isPinned = watch("isPinned");

  // Effect to handle form reset and scroll lock when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        title: note?.title ?? '',
        content: note?.content ?? '',
        tag: note?.tag ?? [],
        isPinned: note?.isPinned ?? false,
        isArchived: note?.isArchived ?? false,
        isDeleted: note?.isDeleted ?? false,
        colour: note?.colour ?? 'default'
      });
      setAvailableTags([...(note?.tag ?? [])]);
      setNewTag("");
      setShowMoreOptions(false);
      setShowBgOptions(false);
      setShowTagDropdown(false);
      setShowMarkdown(false);
      setAlertMessage("");
      setNoteColour(colourOptions.find(option => option.colour === watch("colour")));
      isArchivedNote.current = watch("isArchived") === true;
      isDeletedNote.current = watch("isDeleted") === true;
      history.current = note?.content ? [{ content: note.content, cursor: 0, scrollTop: 0 }] : [{ content: "", cursor: 0, scrollTop: 0 }];
      historyIndex.current = 0;
      isInternalChange.current = false;
      setHistoryIndexState(0);
      requestAnimationFrame(() => {
        if (titleRef.current.value) {
          handleTitleInput();
        }
        contentRef.current.focus();
        contentRef.current.setSelectionRange(0, 0);
        contentRef.current.scrollTop = 0;
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
  }, [note, isOpen, watch("isArchived"), watch("isDeleted"), watch("colour")]);

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

  useEffect(() => {
    setNoteColour(colourOptions.find(option => option.colour === watch("colour")));
  }, [watch("colour")]);

  // Set cursor and scrollTop in textarea with smooth scroll
  const restoreCursorAndScroll = useCallback((cursor, scrollTop) => {
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
  }, []);

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
  const handleTitleInput = useCallback(() => {
    const textarea = titleRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Handle title textarea click
  const handleTitleClick = useCallback(() => {
    if (showBgOptions) setShowBgOptions(false);
    if (showMoreOptions) setShowMoreOptions(false);
    watch("isDeleted") && setAlertMessage("Can't edit in bin");
  }, [showBgOptions, showMoreOptions, watch("isDeleted")]);

  // Capture initial cursor and scrollTop set by the user in first history state
  const handleContentFocus = useCallback(() => {
    if (note?.content === contentRef.current.value) {
      history.current[0].cursor = contentRef.current.selectionEnd;
      history.current[0].scrollTop = contentRef.current.scrollTop;
    }
  }, [note?.content]);

  // Handle content textarea click
  const handleContentClick = useCallback(() => {
    if (showBgOptions) setShowBgOptions(false);
    if (showMoreOptions) setShowMoreOptions(false);
    watch("isDeleted") ? setAlertMessage("Can't edit in bin") : handleContentFocus();
  }, [showBgOptions, showMoreOptions, watch("isDeleted")]);

  // Clear form data and UI state
  const clearForm = useCallback(() => {
    reset({
      title: '',
      content: '',
      tag: [],
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      colour: 'default'
    });
    setAvailableTags([]);
    setNewTag("");
    setAlertMessage("");
    setNoteColour(colourOptions[0]);
  }, []);

  // Add a new tag to the dropdown
  const addNewTag = useCallback(() => {
    if (newTag && !availableTags.includes(newTag)) {
      setAvailableTags([...availableTags, newTag]);
      setNewTag("");
    }
  }, [newTag, availableTags]);

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
      note1.isPinned === note2.isPinned && note1.isArchived === note2.isArchived && note1.isDeleted === note2.isDeleted && note1.colour === note2.colour;
  }, [areArraysEqual]);

  // Handle note submission (new note or update existing)
  const handleFormSubmit = useCallback(async (data) => {
    const isBlank = !watch("title")?.trim() && !markdownContent?.trim();
    if (isBlank && !note) {
      onClose();
      return;
    }
    if (note && areNotesEqual(data, note)) {
      onClose();
      return;
    }
    const isNoteTextChanged = note ? !(note.title === data.title && note.content === data.content) : true;
    const newNote = {
      title: data.title,
      content: data.content,
      tag: [...(data.tag || [])],
      isPinned: isBlank ? false : data.isPinned,
      isArchived: isBlank ? false : data.isArchived,
      isDeleted: isBlank ? true : data.isDeleted,
      colour: data.colour,
      updatedAt: isNoteTextChanged ? new Date().toISOString() : note.updatedAt
    }
    let success;
    if (note?._id) {
      success = await editNote({ ...newNote, _id: note._id });
    } else {
      success = await addNote(newNote);
    }
    if (success) {
      clearForm();
      onClose();
    }
  }, [watch("title"), note, areNotesEqual, editNote, addNote, onClose, markdownContent]);

  // Handle pin toggle
  const togglePin = useCallback(() => {
    setShowMoreOptions(false);
    setShowBgOptions(false);
    setShowTagDropdown(false);
    if (isPinned) {
      setValue("isPinned", false);
    } else {
      setValue("isPinned", true);
      setValue("isArchived", false);
    }
  }, [isPinned])

  // Handle permanent deletion of a note (after successful confirmation)
  const handlePermanentDelete = useCallback(async (result) => {
    setShowConfirm(false);
    if (result) {
      await permanentDelete(note);
      clearForm();
      onClose();
    }
  }, [note, permanentDelete, onClose]);

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
      <div className="fixed inset-0 z-40 flex justify-center items-center bg-[#3130308c] dark:bg-[#80808048]"
        onMouseDown={(e) => mouseDownTarget.current = e.target} onMouseUp={(e) => { if (mouseDownTarget.current === e.target) handleSubmit(handleFormSubmit)() }}>
        {/* Modal */}
        <div className="relative w-full sm:rounded-xl sm:max-w-[95vw] lg:max-w-[85vw] h-full sm:max-h-[97vh] xl:max-h-[94vh] bg-white dark:bg-gray-900 flex flex-col" onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()}>
          {/* Grid */}
          <div className="md:grid md:grid-cols-2 flex-grow overflow-hidden">
            <form id="note-form" onSubmit={handleSubmit(handleFormSubmit)} className={`${noteColour.colour === "default" ? "bg-white dark:bg-gray-800" : noteColour.bgColour} rounded-none md:rounded-t-lg md:rounded-tr-none shadow-sm overflow-y-auto h-full flex flex-col ${showMarkdown ? "hidden md:block" : ""}`}>
              <div className={`flex items-center justify-between p-1 sm:px-2 sm:py-1.5 border-b ${noteColour.colour === "default" ? "border-gray-200 dark:border-gray-700" : "border-gray-700/20"}`}>
                <textarea
                  {...register("title")}
                  ref={(e) => { register("title").ref(e); titleRef.current = e; }}
                  placeholder="Title"
                  rows={1}
                  maxLength={180}
                  autoComplete="off"
                  spellCheck="false"
                  onChange={handleTitleInput}
                  onClick={handleTitleClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (contentRef.current) {
                        contentRef.current.focus();
                        contentRef.current.setSelectionRange(0, 0);
                        contentRef.current.scrollTop = 0;
                      }
                    }
                  }} className={`text-gray-900 ${noteColour.colour === "default" ? "dark:text-white dark:bg-gray-800 dark:placeholder-gray-400" : "bg-transparent"} text-xl sm:text-2xl rounded-tr-lg block w-full px-2 py-1 resize-none overflow-y-hidden outline-none`}
                  readOnly={watch("isDeleted") ?? false} />
              </div>
              <div className="p-1 pb-0 md:p-2 md:pr-0 flex flex-col flex-grow text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                <textarea
                  {...register("content")}
                  ref={(e) => { register("content").ref(e); contentRef.current = e; }}
                  onScroll={() => {
                    if (isSyncingRef.current) return;
                    syncScroll(contentRef, previewRef);
                  }}
                  onClick={handleContentClick}
                  maxLength={30000}
                  placeholder="Markdown"
                  autoComplete="off"
                  spellCheck="false"
                  className={`flex-grow text-gray-800 ${noteColour.colour === "default" ? "dark:text-white dark:bg-gray-800 dark:placeholder-gray-400" : "bg-transparent"} text-sm sm:text-md lg:text-[1.03rem] rounded-lg block w-full px-2 py-1 resize-none outline-none custom-scrollbar`}
                  readOnly={watch("isDeleted") ?? false} />
              </div>
              {/* Display Edited date and time in user readable format in small screen */}
              {note && <div className="flex items-center justify-end md:hidden text-[10px] text-gray-600 dark:text-white mr-1 cursor-default">
                {formatUpdatedAt()}
              </div>}
            </form>
            {/* Markdown */}
            <div className={`bg-zinc-50 dark:bg-gray-900 py-2 rounded-tr-lg shadow-sm h-full flex flex-col overflow-y-hidden ${showMarkdown ? "w-full" : "hidden md:flex"}`}>
              <div ref={previewRef}
                onScroll={() => {
                  if (isSyncingRef.current) return;
                  syncScroll(previewRef, contentRef);
                }}
                className="px-4 py-1 max-w-full overflow-auto h-fit flex-grow text-gray-700 dark:text-gray-200 custom-scrollbar">
                <MarkdownRenderer markdownContent={markdownContent} noteColour="default" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 md:px-6 mb-0.5 py-0.5 border-t border-gray-200 dark:border-gray-700"
            onClick={() => {
              if (showBgOptions) setShowBgOptions(false);
              if (showMoreOptions) setShowMoreOptions(false);
            }}>
            <div className="flex items-center">
              <div className="flex items-center sm:gap-4">
                {!isDeletedNote.current ? (
                  <>
                    {/* Pin */}
                    <button onClick={(e) => { e.stopPropagation(); togglePin(); }} className={`relative group flex flex-col justify-center items-center py-1.5 text-gray-600 hover:bg-purple-100 mr-0.5 sm:mr-3 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer ${isPinned ? "px-2 sm:px-2" : "px-3"}`} disabled={isSubmitting}>
                      {isPinned ? <FontAwesomeIcon icon={faThumbtackSlash} className="py-1" /> : <FontAwesomeIcon icon={faThumbtack} className="py-1" />}
                      <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">{isPinned ? "Unpin" : "Pin"}</span>
                    </button>
                    {/* Archive */}
                    <button onClick={(e) => {
                      e.stopPropagation(); if (isArchivedNote.current) { setValue("isArchived", false) }
                      else { setValue("isPinned", false); setValue("isArchived", true); setValue("isDeleted", false); }
                    }} className="relative group flex flex-col justify-center items-center px-3 py-1.5 text-gray-600 hover:bg-purple-100 mr-0.5 sm:mr-3 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>
                      <FontAwesomeIcon icon={faFileArchive} className="py-1" />
                      <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">{isArchivedNote.current ? "Unarchive" : "Archive"}</span>
                    </button>
                    {/* Delete */}
                    {note && <button onClick={(e) => { e.stopPropagation(); setValue("isPinned", false); setValue("isArchived", false); setValue("isDeleted", true); }} className="relative group flex flex-col justify-center items-center px-[0.68rem] py-1.5 sm:px-3 text-gray-600 hover:bg-purple-100 mr-0.5 sm:mr-3 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>
                      <FontAwesomeIcon icon={faTrash} className="py-1" />
                      <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Delete</span>
                    </button>}
                    {/* Background colour options */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setShowMoreOptions(false); setShowTagDropdown(false); setShowBgOptions(!showBgOptions); }}
                        className="relative group flex flex-col justify-center items-center px-2.5 py-1.5 text-gray-600 hover:bg-purple-100 mr-0.5 sm:mr-3 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer">
                        <FontAwesomeIcon icon={faPalette} className="py-1" />
                        <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Background options</span>
                      </button>
                      {/* Background Options Dropdown */}
                      <div className={`${showBgOptions ? "absolute" : "hidden"} flex items-center justify-between flex-wrap md:flex-nowrap z-50 bottom-9 -left-25 md:-left-50 w-70 md:w-fit bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg px-2.5 py-1.5 gap-1.5`}>
                        {colourOptions.map((option, index) => (
                          <div key={index} onClick={() => { if (watch("colour") !== option.colour) setValue("colour", option.colour) }}
                            className={`${option.bgColour} ${option.borderColour} border w-8 h-8 rounded-full relative group flex flex-col justify-center items-center cursor-pointer ${noteColour.colour === option.colour ? "border-purple-600" : "border-gray-300 hover:border-gray-800 dark:hover:border-white"}`}>
                            {noteColour.colour === option.colour && <FontAwesomeIcon icon={faCheckCircle} className="text-xs absolute -top-1 -right-0.5 text-purple-600 bg-white rounded-full" />}
                            {option.colour === "default" && <FontAwesomeIcon icon={faDropletSlash} className="py-1 text-gray-600 dark:text-white" />}
                            <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* More */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setShowBgOptions(false); setShowTagDropdown(false); setShowMoreOptions(!showMoreOptions); }}
                        className="relative group flex flex-col justify-center items-center px-[1.06rem] py-1.5 text-gray-600 hover:bg-purple-100 mr-0.5 sm:mr-3 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer">
                        <FontAwesomeIcon icon={faEllipsisV} className="py-1" />
                        <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">More</span>
                      </button>
                      {/* More Options Dropdown */}
                      <div className={`${showMoreOptions ? "absolute" : "hidden"} z-50 py-1.5 bottom-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg cursor-default`}>
                        {moreOptions.map((option, index) => (
                          option.show && <div key={index} onClick={option.onClick} className="px-3 py-1.5 text-sm whitespace-nowrap w-full hover:bg-purple-50 dark:hover:bg-gray-800 text-gray-700 dark:text-white cursor-pointer">{option.name}</div>
                        ))}
                      </div>
                      {/* Tag dropdown */}
                      <div className={`${showTagDropdown ? "absolute" : "hidden"} z-50 bottom-9 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm shadow-lg py-1.5`}>
                        <p className="px-3 mb-1 text-gray-700 dark:text-white">Label note</p>
                        {/* Add new tag section */}
                        <div className="flex items-center px-3 mb-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="New label"
                            className="text-sm py-1 outline-none text-gray-700 dark:text-white bg-transparent"
                            onKeyDown={(e) => { if (e.key === "Enter") addNewTag() }}
                          />
                          <button type="button" onClick={addNewTag} className="bg-purple-500 px-1.5 rounded-full hover:bg-purple-600"><FontAwesomeIcon icon={faAdd} className="text-md text-white" /></button>
                        </div>
                        <div className=" max-h-40 overflow-y-auto custom-scrollbar">
                          {/* Existing tags as checkboxes */}
                          {availableTags.map((tag, index) => (
                            <label key={index} className="flex items-center px-3 py-1 gap-3 text-sm text-gray-800 dark:text-white hover:bg-purple-50 dark:hover:bg-gray-700">
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
                        </div>
                      </div>
                    </div>
                    {/* Toggle between form and markdown in small screen */}
                    <button onClick={(e) => { e.stopPropagation(); setShowMarkdown(!showMarkdown); }} className={`relative group flex flex-col justify-center items-center text-sm text-gray-600 hover:bg-purple-100 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer md:hidden py-1 ${showMarkdown ? "px-1.5 sm:px-2" : "px-[0.43rem]"}`}>
                      {showMarkdown ? <FontAwesomeIcon icon={faEyeSlash} className="py-1" /> : <FontAwesomeIcon icon={faEye} className="py-1" />}
                      <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Toggle markdown</span>
                    </button>
                    {/* Undo/Redo buttons */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                      onMouseDown={(e) => {
                        if (historyIndexState === 0) {
                          e.preventDefault();
                          return false;
                        }
                      }}
                      tabIndex={historyIndexState === 0 ? -1 : 0}
                      className={`relative group flex flex-col justify-center items-center ml-2 sm:ml-5 px-2.5 py-1.5 sm:px-3 md:px-3 sm:py-2.5 text-sm md:text-xl text-gray-600 rounded-full dark:text-white mr-0.5 sm:mr-3 ${historyIndexState === 0 ? "cursor-not-allowed" : "hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 3.5 20 18.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`sm:w-3.5 sm:h-4 w-3 h-4 text-gray-600 dark:text-white ${historyIndexState === 0 && "opacity-50"}`}>
                        <path d="M3 8h10a6 6 0 0 1 0 12H5.5" />
                        <polyline points="6.5 5.5 2 8 6.5 10.5" />
                      </svg>
                      <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Undo</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRedo(); }}
                      onMouseDown={(e) => {
                        if (historyIndexState === history.current.length - 1) {
                          e.preventDefault();
                          return false;
                        }
                      }}
                      tabIndex={historyIndexState === history.current.length - 1 ? -1 : 0}
                      className={`relative group flex flex-col justify-center items-center px-2.5 py-1.5 sm:px-3 md:px-3 sm:py-2.5 text-sm md:text-xl text-gray-600 rounded-full dark:text-white ${historyIndexState === history.current.length - 1 ? "cursor-not-allowed" : "hover:bg-purple-100 dark:hover:bg-gray-700 cursor-pointer"}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 3.5 20 18.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`sm:w-3.5 sm:h-4 w-3 h-4 text-gray-600 dark:text-white -scale-x-100 ${historyIndexState === history.current.length - 1 && "opacity-50"}`}>
                        <path d="M3 8h10a6 6 0 0 1 0 12H5.5" />
                        <polyline points="6.5 5.5 2 8 6.5 10.5" />
                      </svg>
                      <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Redo</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Restore */}
                    <button onClick={(e) => { e.stopPropagation(); setValue("isPinned", false); setValue("isArchived", false); setValue("isDeleted", false); }}
                      className="relative group flex flex-col justify-center items-center px-2.5 py-1.5 sm:px-3 text-gray-600 hover:bg-purple-100 mr-0.5 sm:mr-3 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>
                      <FontAwesomeIcon icon={faUndo} className="py-1" />
                      <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Restore</span>
                    </button>
                    {/* Permanent Delete */}
                    <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
                      className="relative group flex flex-col justify-center items-center px-[0.68rem] py-1.5 sm:px-3 text-gray-600 hover:bg-purple-100 mr-0.5 sm:mr-3 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer">
                      <FontAwesomeIcon icon={faTrash} className="py-1" />
                      <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Delete forever</span>
                    </button>
                    {/* Toggle between form and markdown in small screen */}
                    <button onClick={(e) => { e.stopPropagation(); setShowMarkdown(!showMarkdown); }} className={`relative group flex flex-col justify-center items-center text-sm text-gray-600 hover:bg-purple-100 rounded-full dark:text-white dark:hover:bg-gray-700 cursor-pointer md:hidden py-1 ${showMarkdown ? "px-1.5 sm:px-2" : "px-[0.43rem]"}`}>
                      {showMarkdown ? <FontAwesomeIcon icon={faEyeSlash} className="py-1" /> : <FontAwesomeIcon icon={faEye} className="py-1" />}
                      <span className="absolute bg-[#22262cce] px-2.5 pt-0.5 pb-1 rounded-sm mt-16 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">Toggle markdown</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Display Edited date and time in user readable format, Close button */}
            <div className="flex items-center gap-1 sm:gap-3 mr-1" onClick={(e) => e.stopPropagation()}>
              {note && <div className="md:flex items-center hidden text-[10px] md:text-[11.3px] lg:text-sm text-gray-600 dark:text-white cursor-default">
                <p className="mr-1">{formatUpdatedAt()}</p>
              </div>}
              <button className="flex items-center justify-center font-semibold bg-transparent text-gray-600 dark:text-white px-2 py-1 sm:px-6 sm:py-2 rounded-md hover:bg-purple-100 dark:hover:bg-gray-800 cursor-pointer" type="submit" form="note-form" disabled={isSubmitting}>Close</button>
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