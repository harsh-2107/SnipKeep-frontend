import { useContext, useState, useEffect, createContext } from "react";
import { useLocation } from "react-router-dom";

const NoteContext = createContext();

export const NoteProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [searchedNotes, setSearchedNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const location = useLocation();

  // Fetche notes from the backend using a filter and set alert message if an error occurs during fetch
  const fetchNotes = async (filter) => {
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
  };

  // Send a new note to the backend to be saved and place the note in the correct state (pinned, archived or regular)
  const addNote = async (note) => {
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
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to add note. Please try again.");
    }
  }

  // Update an existing note on the server and in local state
  const editNote = async (note) => {
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
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to update note. Please try again.");
    }
  }

  // Search for notes based on searched text and populate the searchedNotes state with the results
  const search = async (searchText) => {
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
  }

  // Toggle a note's pinned state (pin/unpin) and move it between states accordingly
  const onPin = async (note) => {
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
  }

  // Toggle a note's archived state (archive/unarchive) and move it between states accordingly
  const onArchive = async (note) => {
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
  }

  // Toggle a note's deleted state (delete/restore) and move it between states accordingly
  const onDelete = async (note) => {
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
  }

  // Permanently delete a note from the backend and state (only works for already deleted notes)
  const permanentDelete = async (note) => {
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
  }

  // Opens the modal to edit a selected note
  const openEditModal = (note) => {
    setSelectedNote(note)
    setModalOpen(true)
  }

  // On component mount, fetch all note categories from backend and set loading state during fetch to control loading UI
  useEffect(() => {
    const getAllNotes = async () => {
      setLoading(true);
      setNotes(await fetchNotes(""));
      setPinnedNotes(await fetchNotes("?filter=pinned"));
      setArchivedNotes(await fetchNotes("?filter=archived"));
      setDeletedNotes(await fetchNotes("?filter=deleted"));
      setLoading(false);
    }

    getAllNotes();
  }, []);

  // Clear alert message when the user navigates to a new page
  useEffect(() => {
    if (alertMessage) {
      setAlertMessage("");
    }
  }, [location.pathname])

  return (
    <NoteContext.Provider value={{ notes, setNotes, pinnedNotes, archivedNotes, deletedNotes, searchedNotes, onPin, onArchive, onDelete, permanentDelete, openEditModal, selectedNote, isModalOpen, setModalOpen, addNote, editNote, search, loading, alertMessage, setAlertMessage }}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNoteContext = () => useContext(NoteContext);