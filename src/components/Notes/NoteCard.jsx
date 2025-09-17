import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNoteContext } from '../../context/NoteContext';
import { useTagContext } from '../../context/TagContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faMagnifyingGlass, faUndo, faThumbtack, faFileArchive, faTrash, faThumbTackSlash, faPalette, faEllipsisV, faDropletSlash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import MarkdownRenderer from '../MarkdownRenderer';

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

const NoteCard = ({ note, viewMode, onRequestPermanentDelete }) => {
  const { onPin, onArchive, onDelete, changeNoteColour, changeNoteTags, makeNoteCopy, downloadMarkdown, openEditModal, activeNoteId, setActiveNoteId, openDropdownNoteId, setOpenDropdownNoteId, dropdownType, setDropdownType } = useNoteContext();
  const { globalTags, addTag } = useTagContext();
  const [filteredGlobalTags, setFilteredGlobalTags] = useState(globalTags);
  const [selectedTags, setSelectedTags] = useState(note.tag);
  const [newTag, setNewTag] = useState("");
  const [isActive, setIsActive] = useState(activeNoteId === note._id);
  const [noteColour, setNoteColour] = useState(colourOptions.find(option => option.colour === note.colour));

  // Ref to track the original tags for rollback
  const originalTagsRef = useRef(note.tag);
  const pendingUpdateRef = useRef(null);

  const moreOptions = useMemo(() => [
    { name: selectedTags.length === 0 ? "Add label" : "Change labels", onClick: () => { setOpenDropdownNoteId(note._id); setDropdownType('tag'); } },
    { name: "Make a copy", onClick: () => makeNoteCopy(note) },
    { name: "Download markdown", onClick: () => downloadMarkdown(note.title, note.content) }
  ], [selectedTags, makeNoteCopy, downloadMarkdown]);

  // Update selected tags when note.tag changes (from external updates)
  useEffect(() => {
    setSelectedTags(note.tag);
    originalTagsRef.current = note.tag;
  }, [note.tag]);

  useEffect(() => {
    setNoteColour(colourOptions.find(option => option.colour === note.colour));
  }, [note.colour])

  // Debounced tag update function
  const debouncedTagUpdate = useCallback((newTags = selectedTags) => {
    // Clear previous pending update
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }
    // Set a new timeout for the update
    pendingUpdateRef.current = setTimeout(async () => {
      try {
        const success = await changeNoteTags(note, newTags);
        if (success) {
          // Update successful - sync original tags
          originalTagsRef.current = newTags;
        } else {
          // Update failed - rollback to original tags
          setSelectedTags(originalTagsRef.current);
        }
      } catch (error) {
        // Update failed - rollback to original tags
        setSelectedTags(originalTagsRef.current);
      } finally {
        pendingUpdateRef.current = null;
      }
    }, 200); // 400ms debounce
  }, [note, selectedTags, changeNoteTags]);

  // Handle tag checkbox change with optimistic update
  const handleTagChange = useCallback((tagName, isChecked) => {
    const newTags = isChecked
      ? [...selectedTags, tagName]
      : selectedTags.filter(t => t !== tagName);
    setSelectedTags(newTags);
    // Debounced API update
    debouncedTagUpdate(newTags);
  }, [selectedTags, debouncedTagUpdate]);

  // Add a new tag to the dropdown and automatically select it
  const addNewTag = useCallback(async () => {
    if (newTag.trim()) {
      const trimmedTag = newTag.trim();
      try {
        // Add tag to global tags first
        await addTag({ name: trimmedTag });
        // If successful, add to selected tags with optimistic update
        if (!selectedTags.includes(trimmedTag)) {
          const newTags = [...selectedTags, trimmedTag];
          setSelectedTags(newTags);
          debouncedTagUpdate(newTags);
        }
        setNewTag("");
      } catch (error) {
        // Handle error if needed
        console.error("Failed to add new tag:", error);
      }
    }
  }, [newTag, selectedTags, addTag, debouncedTagUpdate]);

  // Filter global tags based on search
  useEffect(() => {
    if (newTag) {
      const filtered = globalTags.filter(tag =>
        tag.name.toLowerCase().includes(newTag.toLowerCase())
      );
      setFilteredGlobalTags(filtered);
    } else {
      setFilteredGlobalTags(globalTags);
    }
  }, [newTag, globalTags]);

  // Cleanup pending updates on unmount
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, []);

  // Open note edit modal and close all the dropdowns on card click
  const handleCardClick = useCallback(() => {
    setOpenDropdownNoteId(null);
    setDropdownType('');
    openEditModal(note);
    setActiveNoteId(note._id);
    setIsActive(true);
  }, [openEditModal, note]);

  // Toggle background options dropdown visibility
  const toggleBgOptions = useCallback(() => {
    if (openDropdownNoteId === note._id && dropdownType === 'bg') {
      setOpenDropdownNoteId(null);
      setDropdownType("");
    } else {
      setOpenDropdownNoteId(note._id);
      setDropdownType('bg');
    }
  }, [openDropdownNoteId, dropdownType, note._id]);

  // Toggle more options dropdown visibility
  const toggleMoreOptions = useCallback(() => {
    if (openDropdownNoteId === note._id && dropdownType === 'more') {
      setOpenDropdownNoteId(null);
      setDropdownType("");
    } else {
      setOpenDropdownNoteId(note._id);
      setDropdownType('more');
    }
  }, [openDropdownNoteId, dropdownType, note._id]);

  // Change the background colour of the note
  const changeColour = useCallback(async (colour) => {
    if (noteColour !== colour) {
      const success = await changeNoteColour(note, colour);
      if (success) {
        setNoteColour(colourOptions.find(option => option.colour === colour));
      }
    }
  }, [noteColour, changeNoteColour, note]);

  return (
    <>
      <div className={`relative px-3 pt-2.5 pb-1.5 border rounded-lg hover:shadow-sm/20 dark:hover:shadow-md/20 dark:hover:shadow-gray-300 flex flex-col justify-between select-none max-h-[610px] transition-all duration-200 w-full ${viewMode === 'list' ? "" : "min-w-[200px]"} ${noteColour.colour === "default" ? "bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-500" : `${noteColour.bgColour} ${noteColour.borderColour}`}`}
        onClick={(e) => { e.stopPropagation(); handleCardClick(); }} onMouseEnter={() => setIsActive(true)} onMouseLeave={() => setIsActive(activeNoteId === note._id)}>
        {isActive && <FontAwesomeIcon icon={faCheckCircle} className="text-lg absolute -top-2 -left-1.5 bg-white dark:text-white dark:bg-gray-900 rounded-full" />}
        <div className="flex flex-col overflow-hidden flex-grow">
          <h4 className={`${note.title ? "" : "hidden"} mb-2 text-xl font-semibold tracking-tight text-gray-800 line-clamp-3 flex-shrink-0 ${noteColour.colour === "default" ? "dark:text-purple-200" : ""}`}>
            {note.title}
          </h4>
          <div className="font-normal mb-3 rounded-md text-gray-700 dark:text-gray-400 max-w-full overflow-hidden flex-grow">
            <MarkdownRenderer markdownContent={note.content} noteColour={noteColour.colour} />
          </div>
          <div className={`${note.tag.length === 0 ? "hidden" : ""} flex mt-1 mb-2 gap-2 flex-wrap`}>
            {note.tag.map(t => (
              <div key={t}
                className={`px-2.5 py-[0.25rem] text-xs relative z-[2] rounded-full truncate ${noteColour.colour === "default" ? "bg-purple-100 dark:bg-purple-300" : `${noteColour.bgColour} after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-50 after:z-[1]`}`}>
                <span className="relative z-20">{t}</span>
              </div>
            ))}
          </div>
        </div>
        {!note.isDeleted ? (
          <div className="flex items-center justify-between gap-1 flex-shrink-0 max-w-xs">
            <button onClick={(e) => { e.stopPropagation(); onPin(note); }}
              className={`${note.isPinned ? "px-1.5" : "px-2.5"} py-1 relative group flex flex-col justify-center items-center  ${noteColour.colour === "default" ? "text-gray-700 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800" : `text-gray-800 hover:${noteColour.bgColour} after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-0 hover:after:opacity-50`} rounded-full cursor-pointer flex-shrink-0`}>
              {note.isPinned ? <FontAwesomeIcon icon={faThumbTackSlash} className="py-1" /> : <FontAwesomeIcon icon={faThumbtack} className="py-1" />}
              <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                {note.isPinned ? "Unpin" : "Pin"}
              </span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onArchive(note); }}
              className={`px-2.5 py-1 relative group flex flex-col justify-center items-center  ${noteColour.colour === "default" ? "text-gray-700 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800" : `text-gray-800 hover:${noteColour.bgColour} after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-0 hover:after:opacity-50`} rounded-full  cursor-pointer flex-shrink-0`}>
              <FontAwesomeIcon icon={faFileArchive} className="py-1" />
              <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">{note.isArchived ? "Unarchive" : "Archive"}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(note); }}
              className={`px-[0.55rem] py-1 relative group flex flex-col justify-center items-center  ${noteColour.colour === "default" ? "text-gray-700 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800" : `text-gray-800 hover:${noteColour.bgColour} after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-0 hover:after:opacity-50`} rounded-full  cursor-pointer flex-shrink-0`}>
              <FontAwesomeIcon icon={faTrash} className="py-1" />
              <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">Delete</span>
            </button>
            <div className="relative flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); toggleBgOptions(); }}
                className={`px-2 py-1 relative group flex flex-col justify-center items-center  ${noteColour.colour === "default" ? "text-gray-700 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800" : "text-gray-800 after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-0 hover:after:opacity-50"} rounded-full  cursor-pointer flex-shrink-0`}>
                <FontAwesomeIcon icon={faPalette} className="py-1" />
                <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">Background options</span>
              </button>
              {/* Background Options Dropdown */}
              <div className={`${openDropdownNoteId === note._id && dropdownType === 'bg' ? "absolute" : "hidden"} flex items-center justify-between z-[5] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg px-2.5 py-1.5 gap-1.5 top-8 ${viewMode === 'list' && window.innerWidth > 640 ? "flex-nowrap w-fit -left-40" : "flex-wrap w-50 sm:w-70 -left-30 sm:-bottom-21 sm:-left-45"}`} onClick={(e) => e.stopPropagation()}>
                {colourOptions.map((option, index) => (
                  <div key={index} onClick={(e) => { e.stopPropagation(); changeColour(option.colour) }}
                    className={`${option.bgColour} ${option.borderColour} border w-8 h-8 rounded-full relative group flex flex-col justify-center items-center cursor-pointer ${noteColour.colour === option.colour ? "border-purple-600" : "border-gray-300 hover:border-gray-800 dark:hover:border-white"}`}>
                    {noteColour.colour === option.colour && <FontAwesomeIcon icon={faCheckCircle} className="text-xs absolute -top-1 -right-0.5 text-purple-600 bg-white rounded-full" />}
                    {option.colour === "default" && <FontAwesomeIcon icon={faDropletSlash} className="py-1 text-gray-600 dark:text-white" />}
                    <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); toggleMoreOptions(); }}
                className={`px-3.5 py-1 relative group flex flex-col justify-center items-center  ${noteColour.colour === "default" ? "text-gray-700 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800" : `text-gray-800 hover:${noteColour.bgColour} after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-0 hover:after:opacity-50`} rounded-full  cursor-pointer flex-shrink-0`}>
                <FontAwesomeIcon icon={faEllipsisV} className="py-1" />
                <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">More</span>
              </button>
              <div className={`${openDropdownNoteId === note._id && dropdownType === 'more' ? "absolute" : "hidden"} z-[5] py-1.5 top-8 -left-25 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg cursor-default`} onClick={(e) => e.stopPropagation()}>
                {moreOptions.map((option, index) => (
                  <div key={index} onClick={(e) => { e.stopPropagation(); option.onClick(); }}
                    className="px-3 py-1.5 text-sm whitespace-nowrap w-full hover:bg-purple-50 dark:hover:bg-gray-800 text-gray-700 dark:text-white cursor-pointer">
                    {option.name}
                  </div>
                ))}
              </div>
              {/* Tag dropdown */}
              <div className={`${openDropdownNoteId === note._id && dropdownType === 'tag' ? "absolute" : "hidden"} z-[5] top-8 -left-35 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-sm shadow-lg py-1.5`}
                onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center justify-between px-3 mb-1">
                  <p className="font-semibold text-gray-600 dark:text-white">Label note</p>
                </div>

                {/* Add new tag section */}
                <div className="flex items-center px-3 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value.trim())}
                    spellCheck="false"
                    placeholder="Enter label name"
                    className="text-sm py-1 outline-none text-gray-700 dark:text-white bg-transparent flex-grow"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNewTag();
                      }
                    }}
                  />
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs text-gray-500 dark:text-gray-300 ml-2" />
                </div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  {/* Existing tags as checkboxes */}
                  {filteredGlobalTags.map((tag, index) => (
                    <label key={index} className="flex items-center px-3 py-1 gap-3 text-sm text-gray-800 dark:text-white hover:bg-purple-50 dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        value={tag.name}
                        checked={selectedTags.includes(tag.name)}
                        onChange={(e) => { handleTagChange(e.target.value, e.target.checked) }}
                        className="rounded-md accent-purple-600"
                      />
                      {tag.name}
                    </label>
                  ))}
                  {/* Create new tag button */}
                  {filteredGlobalTags.length === 0 && newTag.trim() && (
                    <button
                      className="flex items-center w-full py-1 text-sm text-gray-600 dark:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={addNewTag}
                    >
                      <FontAwesomeIcon icon={faAdd} className="text-md mx-2.5" />
                      <p>Create <b>"{newTag}"</b></p>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onDelete(note); }} className={`px-2 py-1 relative group flex flex-col justify-center items-center  ${noteColour.colour === "default" ? "text-gray-700 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800" : `text-gray-800 hover:${noteColour.bgColour} after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-0 hover:after:opacity-50`} rounded-full  cursor-pointer flex-shrink-0`}>
              <FontAwesomeIcon icon={faUndo} className="py-1" />
              <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">Restore</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onRequestPermanentDelete(note); }} className={`px-2.5 py-1 relative group flex flex-col justify-center items-center  ${noteColour.colour === "default" ? "text-gray-700 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800" : `text-gray-800 hover:${noteColour.bgColour} after:content-[''] after:absolute after:inset-0 after:bg-black/20 after:rounded-full after:opacity-0 hover:after:opacity-50`} rounded-full  cursor-pointer flex-shrink-0`}>
              <FontAwesomeIcon icon={faTrash} className="py-1" />
              <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">Delete forever</span>
            </button>
          </div>
        )}
      </div >
    </>
  );
};

export default NoteCard;