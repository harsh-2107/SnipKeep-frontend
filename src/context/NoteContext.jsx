import { useContext, useState, useEffect, useMemo, useCallback, createContext } from "react";
import { useLocation } from "react-router-dom";

const NoteContext = createContext();

export const NoteProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [searchedNotes, setSearchedNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [openDropdownNoteId, setOpenDropdownNoteId] = useState(null);
  const [dropdownType, setDropdownType] = useState(""); // 'bg' or 'more'
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const location = useLocation();

  // Decrease order of notes that were after the removed note
  const reorderPreviousCategoryNotes = useCallback((categoryNotes, removedNoteOrder) => {
    return categoryNotes.map(note => {
      if (note.order > removedNoteOrder) {
        return { ...note, order: note.order - 1 };
      }
      return note;
    });
  }, []);

  // Increase order of all existing notes by 1, add new note at order 0
  const reorderNewCategoryNotes = useCallback((newNote, categoryNotes) => {
    return [
      { ...newNote, order: 0 },
      ...categoryNotes.map(note => ({ ...note, order: note.order + 1 }))
    ];
  }, []);

  // Helper to get category setter based on note properties
  const getCategorySetter = useCallback((note) => {
    if (note.isPinned) return setPinnedNotes;
    if (note.isArchived) return setArchivedNotes;
    if (note.isDeleted) return setDeletedNotes;
    return setNotes;
  }, []);

  // Helper to get category notes based on note properties
  const getCategoryNotes = useCallback((note) => {
    if (note.isPinned) return pinnedNotes;
    if (note.isArchived) return archivedNotes;
    if (note.isDeleted) return deletedNotes;
    return notes;
  }, [pinnedNotes, archivedNotes, deletedNotes, notes]);

  // Rollback state utility for optimistic updates
  const rollbackState = useCallback((originalNote) => {
    const allSetters = [setPinnedNotes, setArchivedNotes, setDeletedNotes, setNotes];
    // Remove from all lists first
    allSetters.forEach(setter => {
      setter(prev => prev.filter(n => n._id !== originalNote._id));
    });
    // Add back to correct list with proper ordering
    const targetSetter = getCategorySetter(originalNote);
    const targetNotes = getCategoryNotes(originalNote);
    targetSetter(prev =>
      reorderNewCategoryNotes(
        originalNote,
        reorderPreviousCategoryNotes(targetNotes, originalNote.order)
      )
    );
  }, [getCategorySetter, getCategoryNotes, reorderNewCategoryNotes, reorderPreviousCategoryNotes]);

  // Fetche notes from the backend using a filter and set alert message if an error occurs during fetch
  const fetchNotes = useCallback(async (filter) => {
    try {
      const fetchNotesURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_FETCH_NOTES_ENDPOINT;
      const finalURL = fetchNotesURL + filter;
      const res = await fetch(finalURL, {
        method: "GET",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        const fetchedNotes = await res.json();
        return fetchedNotes;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return [];
      }
    } catch (error) {
      setAlertMessage("Failed to fetch notes. Please reload the page.");
      return [];
    }
  }, []);

  // Send a new note to the backend to be saved and place the note in the correct state (pinned, archived or regular)
  const addNote = useCallback(async (note) => {
    try {
      const addNoteURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_ADD_NOTE_ENDPOINT;
      const res = await fetch(addNoteURL, {
        method: "POST",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(note)
      });
      if (res.ok) {
        const newNote = await res.json();
        if (newNote.isPinned) {
          setPinnedNotes(prev => reorderNewCategoryNotes(newNote, prev));
        } else if (newNote.isArchived) {
          setArchivedNotes(prev => reorderNewCategoryNotes(newNote, prev));
          setAlertMessage("Note archived");
        } else {
          setNotes(prev => reorderNewCategoryNotes(newNote, prev));
        }
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to create note. Please try again.");
      return false;
    }
  }, [reorderNewCategoryNotes]);

  // Update an existing note on the server and in local state
  const editNote = useCallback(async (note) => {
    try {
      const updateNoteURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_UPDATE_NOTE_ENDPOINT;
      const { _id, updatedAt, ...noteWithoutId } = note;
      const finalURL = updateNoteURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(noteWithoutId)
      });
      if (res.ok) {
        const isCategoryChanged = !(
          selectedNote.isPinned === note.isPinned &&
          selectedNote.isArchived === note.isArchived &&
          selectedNote.isDeleted === note.isDeleted
        );
        if (isCategoryChanged) {
          // Remove from previous category and reorder remaining notes
          if (selectedNote.isPinned) {
            setPinnedNotes(prev => {
              const filtered = prev.filter(n => n._id !== note._id);
              return reorderPreviousCategoryNotes(filtered, selectedNote.order);
            });
          } else if (selectedNote.isArchived) {
            setArchivedNotes(prev => {
              const filtered = prev.filter(n => n._id !== note._id);
              return reorderPreviousCategoryNotes(filtered, selectedNote.order);
            });
          } else if (selectedNote.isDeleted) {
            setDeletedNotes(prev => {
              const filtered = prev.filter(n => n._id !== note._id);
              return reorderPreviousCategoryNotes(filtered, selectedNote.order);
            });
          } else {
            setNotes(prev => {
              const filtered = prev.filter(n => n._id !== note._id);
              return reorderPreviousCategoryNotes(filtered, selectedNote.order);
            });
          }
          // Add to new category at top (order 0)
          if (note.isPinned) {
            setPinnedNotes(prev => reorderNewCategoryNotes(note, prev));
            selectedNote.isArchived && setAlertMessage("Note unarchived and pinned");
          } else if (note.isArchived) {
            setArchivedNotes(prev => reorderNewCategoryNotes(note, prev));
            selectedNote.isPinned ? setAlertMessage("Note unpinned and archived") : !selectedNote.isArchived && setAlertMessage("Note archived");
          } else if (note.isDeleted) {
            setDeletedNotes(prev => reorderNewCategoryNotes(note, prev));
            !selectedNote.isDeleted && setAlertMessage("Note binned");
          } else {
            setNotes(prev => reorderNewCategoryNotes(note, prev));
            selectedNote.isArchived && setAlertMessage("Note unarchived");
            selectedNote.isDeleted && setAlertMessage("Note restored");
          }
        } else {
          // Same category - just update the note
          if (note.isPinned) {
            setPinnedNotes(prev => prev.map(n => n._id === note._id ? note : n));
          } else if (note.isArchived) {
            setArchivedNotes(prev => prev.map(n => n._id === note._id ? note : n));
          } else if (note.isDeleted) {
            setDeletedNotes(prev => prev.map(n => n._id === note._id ? note : n));
          } else {
            setNotes(prev => prev.map(n => n._id === note._id ? note : n));
          }
        }
        setSearchedNotes(prev => prev.map(n => n._id === note._id ? note : n));
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to update note. Please try again.");
      return false;
    }
  }, [selectedNote, reorderPreviousCategoryNotes, reorderNewCategoryNotes]);

  // Search for notes based on searched text and populate the searchedNotes state with the results
  const search = useCallback(async (searchText) => {
    try {
      const finalURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_SEARCH_NOTE_ENDPOINT + "?text=" + encodeURIComponent(searchText);
      const res = await fetch(finalURL, {
        method: "GET",
        headers: {
          "auth-token": localStorage.getItem("token")
        }
      });
      if (res.ok) {
        setSearchedNotes(await res.json());
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to search notes. Please reload the page or try again.");
    }
  }, []);

  // Toggle a note's pinned state (pin/unpin) and move it between states accordingly
  const onPin = useCallback(async (note) => {
    const originalNote = { ...note };
    const updatedNote = {
      ...note,
      isPinned: !note.isPinned,
      isArchived: false,
    };
    // Optimistically update UI
    const oldSetter = getCategorySetter(originalNote);
    const newSetter = getCategorySetter(updatedNote);
    oldSetter(prev => {
      const filtered = prev.filter(n => n._id !== note._id);
      return reorderPreviousCategoryNotes(filtered, note.order);
    });
    newSetter(prev => reorderNewCategoryNotes(updatedNote, prev));
    setSearchedNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));
    try {
      const togglePinURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_TOGGLE_PIN_ENDPOINT;
      const finalURL = togglePinURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (!res.ok) {
        throw await res.json();
      }
    } catch (error) {
      // Rollback optimistic update
      rollbackState(originalNote);
      setSearchedNotes(prev => prev.map(n => n._id === originalNote._id ? originalNote : n));
      setAlertMessage(error.error || "Failed to pin/unpin note. Please try again.");
    }
  }, [getCategorySetter, reorderPreviousCategoryNotes, reorderNewCategoryNotes, rollbackState]);

  // Toggle a note's archived state (archive/unarchive) and move it between states accordingly
  const onArchive = useCallback(async (note) => {
    const originalNote = { ...note };
    const isCurrentlyArchived = note.isArchived;
    const updatedNote = {
      ...note,
      isPinned: false,
      isArchived: !isCurrentlyArchived,
    };
    // Optimistically update UI
    const oldSetter = getCategorySetter(originalNote);
    const newSetter = getCategorySetter(updatedNote);
    oldSetter(prev => {
      const filtered = prev.filter(n => n._id !== note._id);
      return reorderPreviousCategoryNotes(filtered, note.order);
    });
    newSetter(prev => reorderNewCategoryNotes(updatedNote, prev));
    setSearchedNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));
    if (!isCurrentlyArchived) {
      setAlertMessage(originalNote.isPinned ? "Note unpinned and archived" : "Note archived");
    } else {
      setAlertMessage("Note unarchived");
    }
    try {
      const toggleArchiveURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_TOGGLE_ARCHIVE_ENDPOINT;
      const finalURL = toggleArchiveURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (!res.ok) {
        throw await res.json();
      }
    } catch (error) {
      // Rollback optimistic update
      rollbackState(originalNote);
      setSearchedNotes(prev => prev.map(n => n._id === originalNote._id ? originalNote : n));
      setAlertMessage(error.error || "Failed to archive/unarchive note. Please try again.");
    }
  }, [getCategorySetter, reorderPreviousCategoryNotes, reorderNewCategoryNotes, rollbackState]);

  // Toggle a note's deleted state (delete/restore) and move it between states accordingly
  const onDelete = useCallback(async (note) => {
    const originalNote = { ...note };
    const isCurrentlyDeleted = note.isDeleted;
    const updatedNote = {
      ...note,
      isPinned: false,
      isArchived: false,
      isDeleted: !isCurrentlyDeleted,
    };
    // Optimistically update UI
    const oldSetter = getCategorySetter(originalNote);
    const newSetter = getCategorySetter(updatedNote);
    oldSetter(prev => {
      const filtered = prev.filter(n => n._id !== note._id);
      return reorderPreviousCategoryNotes(filtered, note.order);
    });
    newSetter(prev => reorderNewCategoryNotes(updatedNote, prev));
    if (!isCurrentlyDeleted) {
      setSearchedNotes(prev => prev.filter(n => n._id !== note._id));
    } else {
      setSearchedNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));
    }
    setAlertMessage(!isCurrentlyDeleted ? "Note binned" : "Note restored");
    try {
      const toggleDeleteURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_TOGGLE_DELETE_ENDPOINT;
      const finalURL = toggleDeleteURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (!res.ok) {
        throw await res.json();
      }
    } catch (error) {
      // Rollback optimistic update
      rollbackState(originalNote);
      if (!originalNote.isDeleted) {
        setSearchedNotes(prev => prev.filter(n => n.isDeleted === false));
      } else {
        setSearchedNotes(prev => prev.map(n => n._id === originalNote._id ? originalNote : n));
      }
      setAlertMessage(error.error || "Failed to delete/restore note. Please try again.");
    }
  }, [getCategorySetter, reorderPreviousCategoryNotes, reorderNewCategoryNotes, rollbackState]);

  // Permanently delete a note from the backend and state (only works for already deleted notes)
  const permanentDelete = useCallback(async (note) => {
    try {
      const permanentDeleteURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_PERMANENT_DELETE_ENDPOINT;
      const finalURL = permanentDeleteURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "DELETE",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        setDeletedNotes(prev => {
          const filtered = prev.filter(n => n._id !== note._id);
          return reorderPreviousCategoryNotes(filtered, note.order);
        });
        setAlertMessage("Note permanently deleted");
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to permanently delete note. Please try again.");
    }
  }, [reorderPreviousCategoryNotes]);

  // Change the colour of the note card
  const changeNoteColour = useCallback(async (note, colour) => {
    try {
      const changeColourURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_CHANGE_COLOUR_ENDPOINT;
      const finalURL = changeColourURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ colour })
      });
      if (res.ok) {
        const updatedNote = { ...note, colour };
        if (note.isPinned) {
          setPinnedNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));
        } else if (note.isArchived) {
          setArchivedNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));
        } else {
          setNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));
        }
        setSearchedNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to change note colour. Please try again.");
      return false;
    }
  }, []);

  // Reorder notes after drag and drop
  const reorderNotes = useCallback(async (reorderedNotes, category) => {
    try {
      const reorderURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_REORDER_ENDPOINT;
      const res = await fetch(reorderURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rearrangedNotes: reorderedNotes,
          category: category
        })
      });
      if (res.ok) {
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error || "Failed to reorder notes. Please try again.");
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to reorder notes. Please try again.");
      return false;
    }
  }, []);

  // Make copy of a note
  const makeNoteCopy = useCallback(async (note) => {
    const newNote = { ...note, isPinned: false, isArchived: false, isDeleted: false };
    const success = await addNote(newNote);
    if (success) {
      setAlertMessage("Note Created");
      setOpenDropdownNoteId(null);
      setDropdownType("");
    }
  }, [addNote]);

  // Download the note as a .md file
  const downloadMarkdown = useCallback((title = "", content = "") => {
    function sanitizeFileName(name = "Note") {
      const sanitized = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim();
      return sanitized.length > 0 ? sanitized.slice(0, 60) : "Note";
    }

    const fileName = sanitizeFileName(title) + ".md";
    const markdownTitle = title.trim() ? `# ${title}\n\n` : "";
    const fileContent = `${markdownTitle}${content}`;
    const blob = new Blob([fileContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Opens the modal to edit a selected note
  const openEditModal = useCallback((note) => {
    setSelectedNote(note);
    setModalOpen(true);
  }, []);

  // On component mount, fetch all note categories from backend and set loading state during fetch to control loading UI
  useEffect(() => {
    const getAllNotes = async () => {
      setLoading(true);
      setNotes(await fetchNotes("?filter="));
      setPinnedNotes(await fetchNotes("?filter=pinned"));
      setArchivedNotes(await fetchNotes("?filter=archived"));
      setDeletedNotes(await fetchNotes("?filter=deleted"));
      setLoading(false);
    };

    getAllNotes();
  }, [fetchNotes]);

  // Clear alert message when the user navigates to a new page
  useEffect(() => {
    if (alertMessage) {
      setAlertMessage("");
    }
  }, [location.pathname]);

  const contextValue = useMemo(() => ({
    notes, pinnedNotes, archivedNotes, deletedNotes, searchedNotes, selectedNote, addNote, editNote, search, onPin, onArchive, onDelete, permanentDelete, changeNoteColour, makeNoteCopy, downloadMarkdown, openEditModal, reorderNotes, isModalOpen, setModalOpen, loading, alertMessage, setAlertMessage, activeNoteId, setActiveNoteId, openDropdownNoteId, setOpenDropdownNoteId, dropdownType, setDropdownType
  }), [notes, pinnedNotes, archivedNotes, deletedNotes, searchedNotes, selectedNote, addNote, editNote, search, onPin, onArchive, onDelete, permanentDelete, changeNoteColour, makeNoteCopy, downloadMarkdown, openEditModal, reorderNotes, isModalOpen, setModalOpen, loading, alertMessage, activeNoteId, openDropdownNoteId, dropdownType]);

  return (
    <NoteContext.Provider value={contextValue}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNoteContext = () => useContext(NoteContext);