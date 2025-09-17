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

  // Fetch notes from the backend using a filter and set alert message if an error occurs during fetch
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
          setPinnedNotes(prev => [newNote, ...prev]);
        } else if (newNote.isArchived) {
          setArchivedNotes(prev => [newNote, ...prev]);
          setAlertMessage("Note archived");
        } else {
          setNotes(prev => [newNote, ...prev]);
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
  }, []);

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
        setNotes(prev => prev.filter(n => n._id !== note._id));
        setPinnedNotes(prev => prev.filter(n => n._id !== note._id));
        setArchivedNotes(prev => prev.filter(n => n._id !== note._id));
        setDeletedNotes(prev => prev.filter(n => n._id !== note._id));
        if (note.isPinned) {
          setPinnedNotes(prev => [note, ...prev]);
          selectedNote.isArchived && setAlertMessage("Note unarchived and pinned");
        } else if (note.isArchived) {
          setArchivedNotes(prev => [note, ...prev]);
          selectedNote.isPinned ? setAlertMessage("Note unpinned and archived") : !selectedNote.isArchived && setAlertMessage("Note archived");
        } else if (note.isDeleted) {
          setDeletedNotes(prev => [note, ...prev]);
          !selectedNote.isDeleted && setAlertMessage("Note binned");
        } else {
          setNotes(prev => [note, ...prev]);
          selectedNote.isArchived && setAlertMessage("Note unarchived");
          selectedNote.isDeleted && setAlertMessage("Note restored");
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
  }, [selectedNote]);

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

  // Search for notes based on note tags and populate the searchedNotes state with the results
  const searchNoteByTag = useCallback(async (tagName) => {
    try {
      const finalURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_SEARCH_BY_TAG_ENDPOINT + "?tagName=" + encodeURIComponent(tagName);
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
      setAlertMessage(`Failed to find notes with tag name ${tagName}. Please try again.`);
    }
  }, []);

  // Toggle a note's pinned state (pin/unpin) and move it between states accordingly
  const onPin = useCallback(async (note) => {
    try {
      const initialNote = JSON.parse(JSON.stringify(note));
      const togglePinURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_TOGGLE_PIN_ENDPOINT;
      const finalURL = togglePinURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        // Remove from all lists
        if (note.isPinned) {
          setPinnedNotes(prev => prev.filter(n => n._id !== note._id));
        } else if (note.isArchived) {
          setArchivedNotes(prev => prev.filter(n => n._id !== note._id));
        } else {
          setNotes(prev => prev.filter(n => n._id !== note._id));
        }
        // Update isPinned key of note
        note.isPinned = !note.isPinned;
        note.isArchived = false;
        // Add to appropriate list
        if (note.isPinned) {
          setPinnedNotes(prev => [note, ...prev]);
        } else {
          setNotes(prev => [note, ...prev]);
        }
        setSearchedNotes(prev => prev.map(n => n._id === note._id ? note : n));
        initialNote.isArchived && setAlertMessage("Note unarchived and pinned");
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to pin/unpin note. Please try again.");
    }
  }, []);

  // Toggle a note's archived state (archive/unarchive) and move it between states accordingly
  const onArchive = useCallback(async (note) => {
    try {
      const initialNote = JSON.parse(JSON.stringify(note));
      const toggleArchiveURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_TOGGLE_ARCHIVE_ENDPOINT;
      const finalURL = toggleArchiveURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        // Remove from all lists
        if (note.isPinned) {
          setPinnedNotes(prev => prev.filter(n => n._id !== note._id));
        } else if (note.isArchived) {
          setArchivedNotes(prev => prev.filter(n => n._id !== note._id));
        } else {
          setNotes(prev => prev.filter(n => n._id !== note._id));
        }
        // Update isArchived key of note
        note.isArchived = !note.isArchived;
        note.isPinned = false;
        // Add to appropriate list
        if (note.isArchived) {
          setArchivedNotes(prev => [note, ...prev]);
        } else {
          setNotes(prev => [note, ...prev]);
        }
        setSearchedNotes(prev => prev.filter(n => n._id !== note._id));
        setSearchedNotes(prev => [note, ...prev]);
        initialNote.isPinned ? setAlertMessage("Note unpinned and archived") : !initialNote.isArchived ? setAlertMessage("Note archived") : setAlertMessage("Note unarchived");
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to archive/unarchive note. Please try again.");
    }
  }, []);

  // Toggle a note's deleted state (delete/restore) and move it between states accordingly
  const onDelete = useCallback(async (note) => {
    try {
      const initialNote = JSON.parse(JSON.stringify(note));
      const toggleDeleteURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_TOGGLE_DELETE_ENDPOINT;
      const finalURL = toggleDeleteURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        // Remove from all lists
        if (note.isPinned) {
          setPinnedNotes(prev => prev.filter(n => n._id !== note._id));
        } else if (note.isArchived) {
          setArchivedNotes(prev => prev.filter(n => n._id !== note._id));
        } else if (note.isDeleted) {
          setDeletedNotes(prev => prev.filter(n => n._id !== note._id));
        } else {
          setNotes(prev => prev.filter(n => n._id !== note._id));
        }
        note.isDeleted = !note.isDeleted;
        note.isPinned = false;
        note.isArchived = false;
        // Add to appropriate list
        if (note.isDeleted) {
          setDeletedNotes(prev => [note, ...prev]);
        } else {
          setNotes(prev => [note, ...prev]);
        }
        setSearchedNotes(prev => prev.filter(n => n.isDeleted === false));
        !initialNote.isDeleted ? setAlertMessage("Note binned") : setAlertMessage("Note restored");
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to delete/restore note note. Please try again.");
    }
  }, []);

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
        const deleteMessage = await res.json();
        // Remove from all lists
        setDeletedNotes(prev => prev.filter(n => n._id !== note._id));
        setAlertMessage(deleteMessage.message);
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to permanently delete note. Please try again.");
    }
  }, []);

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

  // Change note tags
  const changeNoteTags = useCallback(async (note, newTags) => {
    try {
      const changeTagsURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_CHANGE_TAGS_ENDPOINT;
      const finalURL = changeTagsURL + "/" + note._id;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tag: newTags })
      })
      if (res.ok) {
        const updatedNote = { ...note, tag: newTags };
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
      setAlertMessage("Failed to change note tags. Please try again.");
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

  const getAllNotes = useCallback(async () => {
    setLoading(true);
    setNotes(await fetchNotes("?filter="));
    setPinnedNotes(await fetchNotes("?filter=pinned"));
    setArchivedNotes(await fetchNotes("?filter=archived"));
    setDeletedNotes(await fetchNotes("?filter=deleted"));
    setLoading(false);
  }, [fetchNotes]);

  // Clear alert message when the user navigates to a new page
  useEffect(() => {
    if (alertMessage) {
      setAlertMessage("");
    }
  }, [location.pathname]);

  const contextValue = useMemo(() => ({
    notes, pinnedNotes, archivedNotes, deletedNotes, searchedNotes, selectedNote, setNotes, setPinnedNotes, setArchivedNotes, setDeletedNotes, setSearchedNotes, addNote, editNote, search, searchNoteByTag, onPin, onArchive, onDelete, permanentDelete, changeNoteColour, changeNoteTags, getAllNotes, makeNoteCopy, downloadMarkdown, openEditModal, isModalOpen, setModalOpen, loading, alertMessage, setAlertMessage, activeNoteId, setActiveNoteId, openDropdownNoteId, setOpenDropdownNoteId, dropdownType, setDropdownType
  }), [notes, pinnedNotes, archivedNotes, deletedNotes, searchedNotes, selectedNote, setNotes, setPinnedNotes, setArchivedNotes, setDeletedNotes, setSearchedNotes, addNote, editNote, search, searchNoteByTag, onPin, onArchive, onDelete, permanentDelete, changeNoteColour, changeNoteTags, getAllNotes, makeNoteCopy, downloadMarkdown, openEditModal, isModalOpen, setModalOpen, loading, alertMessage, activeNoteId, openDropdownNoteId, dropdownType]);

  return (
    <NoteContext.Provider value={contextValue}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNoteContext = () => useContext(NoteContext);