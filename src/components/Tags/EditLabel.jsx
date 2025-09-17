import { useState, useEffect, useRef, useCallback } from 'react';
import { useTagContext } from '../../context/TagContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd, faXmark, faCheck, faTag, faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import Alert from '../Alert';
import Confirm from '../Confirm';

const CONFIRM_TEXT = `We’ll delete this label and remove it from all of your Markdown notes. Your notes won’t be deleted.`;

const EditLabel = ({ onClose }) => {
  const { globalTags, addTag, updateTag, deleteTag, alertMessage, setAlertMessage } = useTagContext();
  const [editingTagId, setEditingTagId] = useState(null);
  const [isNewTagInputFocused, setIsNewTagInputFocused] = useState(false);
  const [tagLogoHoveredId, setTagLogoHoveredId] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);

  const newTagInputRef = useRef(null);
  const editTagInputRef = useRef({});

  // Effect to focus new tag input on mount and setup body overflow
  useEffect(() => {
    if (newTagInputRef.current) {
      newTagInputRef.current.focus();
      setIsNewTagInputFocused(true);
    }
    setAlertMessage("");
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = '';
  }, [setAlertMessage]);

  // Handle adding a new global tag
  const handleAddTag = async () => {
    const tagName = newTagInputRef.current?.value?.trim();
    if (!tagName) return;
    const success = await addTag({ name: tagName });
    if (success) {
      newTagInputRef.current.value = "";
      newTagInputRef.current.focus();
    }
  }

  // Handle updating an existing tag
  const handleUpdateTag = async (tag) => {
    const tagName = editTagInputRef.current[tag._id]?.value?.trim();
    if (!tagName) return;
    // Check if the tag value actually changed
    if (tagName === tag.name) {
      setEditingTagId(null);
      return;
    }
    const success = await updateTag({ ...tag, name: tagName }, tag.name);
    if (success) {
      setEditingTagId(null);
    }
  }

  // Handle click on new tag input
  const handleNewTagInputClick = () => {
    setIsNewTagInputFocused(true);
    // Cancel any ongoing tag edit when focusing on new tag input
    if (editingTagId) {
      setEditingTagId(null);
    }
  }

  // Handle click to edit an existing tag
  const handleEditTagClick = (tagId) => {
    // Cancel new tag input when editing existing tag
    setIsNewTagInputFocused(false);
    // Cancel any other ongoing edit
    setEditingTagId(tagId);
    setFocusAtInputEnd(editTagInputRef.current[tagId]);
  }

  // Set cursor at input end
  const setFocusAtInputEnd = useCallback((inputRef) => {
    if (inputRef) {
      setTimeout(() => {
        const valueLength = inputRef.value.length;
        inputRef.focus();
        inputRef.setSelectionRange(valueLength, valueLength);
      }, 0);
    }
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[45] flex justify-center items-center bg-[#3130308c]" onClick={() => onClose(false)}>
        <div className="relative w-[95%] max-w-[300px] rounded bg-white dark:bg-gray-900 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="max-h-[585px] overflow-x-hidden overflow-y-auto custom-scrollbar p-4 pb-0">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-white mb-2.5">Edit labels</h2>
            <div className="flex justify-between items-center mb-6">
              <button className="relative group flex flex-col justify-center items-center">
                <FontAwesomeIcon
                  icon={(!isNewTagInputFocused || editingTagId) ? faAdd : faXmark}
                  className={`${(isNewTagInputFocused || editingTagId) ? "px-2" : "px-[0.45rem]"} py-1.5 text-md text-gray-500 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800 rounded-full`}
                  onClick={() => {
                    if (isNewTagInputFocused) { setIsNewTagInputFocused(false); newTagInputRef.current.value = ""; }
                    else { setIsNewTagInputFocused(true); newTagInputRef.current.focus(); }
                  }}
                />
                <span className="fixed bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                  {(isNewTagInputFocused || editingTagId) ? "Cancel" : "Create label"}
                </span>
              </button>

              <input
                ref={newTagInputRef}
                placeholder="Create new label"
                className="py-1 mx-2.5 w-full text-md font-medium text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-transparent focus:border-b border-gray-300 dark:border-white outline-none"
                onClick={handleNewTagInputClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') newTagInputRef.current.value = "";
                }}
                spellCheck="false"
              />

              <button className={`${(!isNewTagInputFocused || editingTagId) ? "invisible" : ""} relative group flex flex-col justify-center items-center`}>
                <FontAwesomeIcon
                  icon={faCheck}
                  className="px-[0.44rem] py-1.5 text-md text-gray-500 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800 rounded-full"
                  onClick={(e) => { e.preventDefault(); handleAddTag(); }}
                />
                <span className="fixed bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-14 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">Create label</span>
              </button>
            </div>

            {globalTags.map((tag) => (
              <div key={tag._id} className="flex justify-between items-center mb-3">
                <button
                  onMouseEnter={() => setTagLogoHoveredId(tag._id)}
                  onMouseLeave={() => setTagLogoHoveredId(null)}
                // disabled={editingTagId !== null && editingTagId !== tag._id}
                >
                  {tagLogoHoveredId === tag._id || editingTagId === tag._id ?
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="px-[0.45rem] py-1.5 text-md text-gray-500 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800 rounded-full"
                      onClick={() => setTagToDelete(tag)}
                    />
                    :
                    <FontAwesomeIcon
                      icon={faTag}
                      className="px-[0.45rem] py-1.5 rotate-[135deg] text-md text-gray-500 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800 rounded-full"
                    />
                  }
                </button>

                <input
                  ref={el => editTagInputRef.current[tag._id] = el}
                  placeholder="Enter label name"
                  defaultValue={tag.name}
                  className={`pb-0.5 mx-2.5 my-0.5 w-full text-[15px] font-medium text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 bg-transparent ${editingTagId === tag._id ? "border-b border-gray-300 dark:border-white" : ""} outline-none`}
                  onClick={() => {
                    if (editingTagId !== tag._id) {
                      handleEditTagClick(tag._id);
                    }
                  }}
                  readOnly={editingTagId !== tag._id}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateTag(tag);
                    }
                    if (e.key === 'Escape') {
                      handleCancelAction();
                    }
                  }}
                  spellCheck="false"
                />

                {editingTagId !== tag._id ?
                  <FontAwesomeIcon
                    icon={faPen}
                    className="p-2 text-sm mb-0.5 text-gray-500 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800 rounded-full"
                    onClick={() => handleEditTagClick(tag._id)}
                  />
                  :
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="p-1.5 text-md text-gray-500 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-800 rounded-full"
                    onClick={() => handleUpdateTag(tag)}
                  />
                }
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end w-full px-6 pt-2 mb-3 border-t border-gray-300 dark:border-gray-600">
            <button onClick={() => onClose(false)}
              className="font-semibold dark:bg-transparent text-gray-700 dark:text-white px-4 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-800 transition">Done</button>
          </div>
        </div>
      </div >

      {tagToDelete && (
        <Confirm text={CONFIRM_TEXT} onClose={async (confirm) => {
          if (confirm) {
            await deleteTag(tagToDelete);
          }
          setTagToDelete(null);
        }
        } />
      )}

      {alertMessage && <Alert text={alertMessage} color="red" />}
    </>
  )
}

export default EditLabel;