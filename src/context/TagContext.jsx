import { useContext, useState, useEffect, useMemo, useCallback, createContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNoteContext } from "./NoteContext";

const TagContext = createContext();

export const TagProvider = ({ children }) => {
  const { setNotes, setPinnedNotes, setArchivedNotes, setDeletedNotes, setSearchedNotes } = useNoteContext();
  const [globalTags, setGlobalTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Fetche tags from the backend and set alert message if an error occurs during fetch
  const fetchTags = useCallback(async () => {
    try {
      const fetchNotesURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_FETCH_TAGS_ENDPOINT;
      const res = await fetch(fetchNotesURL, {
        method: "GET",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        setGlobalTags(await res.json());
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to fetch tags. Please reload the page.");
    }
  }, []);

  // Add a new tag
  const addTag = useCallback(async (tag) => {
    try {
      // Validate input
      if (!tag?.name) {
        setAlertMessage("Label cannot be empty");
        return false;
      }
      const tagName = tag.name;
      // Check for duplicates (case-insensitive)
      if (globalTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
        setAlertMessage("Label already exists");
        return false;
      }
      const addTagURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_ADD_TAG_ENDPOINT;
      const res = await fetch(addTagURL, {
        method: "POST",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: tagName })
      });
      if (res.ok) {
        const newTag = await res.json();
        setGlobalTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })));
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to create tag. Please try again.");
      return false;
    }
  }, [globalTags]);

  // Update an existing tag
  const updateTag = useCallback(async (tag, prevTagName) => {
    try {
      // Validate input
      if (!tag?._id || !tag?.name?.trim()) {
        setAlertMessage("Invalid label data");
        return false;
      }
      const tagName = tag.name.trim();
      // Check if the tag actually changed
      const currentTag = globalTags.find(t => t._id === tag._id);
      if (currentTag && currentTag.name === tagName) {
        return true; // No change needed
      }
      // Check for duplicates with other tags (case-insensitive)
      if (globalTags.some(t => t._id !== tag._id && t.name.toLowerCase() === tagName.toLowerCase())) {
        setAlertMessage("Label already exists");
        return false;
      }
      const updateTagURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_UPDATE_TAG_ENDPOINT;
      const finalURL = updateTagURL + "/" + tag._id;
      const { _id, ...tagWithoutId } = tag;
      const res = await fetch(finalURL, {
        method: "PUT",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...tagWithoutId, name: tagName })
      });
      if (res.ok) {
        setGlobalTags(prev =>
          prev.map(t =>
            t._id === tag._id ? { ...t, name: tagName } : t
          ).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        );
        const updateNoteTags = (notes) =>
          notes.map(note => ({
            ...note,
            tag: note.tag.map(t => t === prevTagName ? tag.name : t).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
          }));
        setNotes(prev => updateNoteTags(prev));
        setPinnedNotes(prev => updateNoteTags(prev));
        setArchivedNotes(prev => updateNoteTags(prev));
        setDeletedNotes(prev => updateNoteTags(prev));
        setSearchedNotes(prev => updateNoteTags(prev));
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to update tag. Please try again.");
      return false;
    }
  }, [globalTags]);

  // Delete a tag
  const deleteTag = useCallback(async (tag) => {
    try {
      if (!tag?._id) {
        setAlertMessage("Invalid tag data");
        return false;
      }
      const deleteTagURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_DELETE_TAG_ENDPOINT;
      const finalURL = deleteTagURL + "/" + tag._id;
      const res = await fetch(finalURL, {
        method: "DELETE",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        setGlobalTags(prev => prev.filter(t => t._id !== tag._id));
        const removeTagFromNotes = (notes) =>
          notes.map(note => ({
            ...note,
            tag: note.tag.filter(t => t !== tag.name)
          }));
        setNotes(prev => removeTagFromNotes(prev));
        setPinnedNotes(prev => removeTagFromNotes(prev));
        setArchivedNotes(prev => removeTagFromNotes(prev));
        setDeletedNotes(prev => removeTagFromNotes(prev));
        setSearchedNotes(prev => removeTagFromNotes(prev));
        if (location.pathname === `/label/${encodeURIComponent(tag.name)}`) {
          navigate("/notes", { replace: true });
        }
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to DELETE tag. Please try again.");
      return false;
    }
  }, [globalTags, location, navigate]);

  // Fetch tags by calling function and setting loading screen
  const fetchAllTags = useCallback(async () => {
    setLoading(true);
    await fetchTags();
    setLoading(false);
  }, [fetchTags]);

  const contextValue = useMemo(() => ({
    globalTags, addTag, updateTag, deleteTag, fetchAllTags, loading, alertMessage, setAlertMessage
  }), [globalTags, addTag, updateTag, deleteTag, fetchAllTags, loading, alertMessage]);

  return (
    <TagContext.Provider value={contextValue}>
      {children}
    </TagContext.Provider>
  );
};

export const useTagContext = () => useContext(TagContext);