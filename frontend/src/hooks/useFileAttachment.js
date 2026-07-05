import { useState, useRef } from 'react';

/**
 * useFileAttachment — Custom Hook
 *
 * This hook encapsulates all logic for selecting and reading a file attachment.
 *
 * Why a custom hook?
 *   Before this refactor, the file input element, onChange handler, and FileReader
 *   logic all lived inline inside PromptInput.jsx. Extracting it here means:
 *   - PromptInput only needs to call `openFilePicker()` and use `attachment`
 *   - The file-reading complexity lives in ONE focused place
 *
 * Usage:
 *   const { attachment, fileInputRef, openFilePicker, clearAttachment } = useFileAttachment();
 *
 * @returns {{
 *   attachment: object | null,        — The current selected file (or null if none)
 *   fileInputRef: React.RefObject,    — Attach this to a hidden <input type="file">
 *   openFilePicker: (accept) => void, — Call this to open the OS file picker dialog
 *   clearAttachment: () => void,      — Call this to remove the selected file
 *   handleFileInputChange: Function,  — Attach this to the <input>'s onChange event
 * }}
 */
export function useFileAttachment() {
  /**
   * The attachment object. Has this shape (or null if no file is selected):
   * {
   *   file:     File,    — The raw File object from the browser
   *   base64:   string,  — The file's contents encoded as a data URL (e.g. "data:image/png;base64,...")
   *   mimeType: string,  — e.g. "image/png", "application/pdf"
   *   url:      string,  — A temporary blob URL for showing image previews
   * }
   */
  const [attachment, setAttachment] = useState(null);

  // A ref to the hidden <input type="file"> element in the DOM.
  // We need this to programmatically trigger the file picker dialog.
  const fileInputRef = useRef(null);

  /**
   * Opens the OS file picker dialog.
   *
   * @param {string} accept - A comma-separated list of accepted MIME types or extensions.
   *   Examples: 'image/*', 'image/*,application/pdf,text/plain'
   *   (This is the same value you'd put in <input type="file" accept="...">)
   */
  const openFilePicker = (accept) => {
    if (fileInputRef.current) {
      // Dynamically change which file types are allowed before opening the picker
      fileInputRef.current.setAttribute('accept', accept);
      fileInputRef.current.click();
    }
  };

  /** Removes the currently selected attachment. */
  const clearAttachment = () => setAttachment(null);

  /**
   * Called when the user selects a file in the OS file picker dialog.
   * Reads the file and converts it to a base64 data URL so we can:
   *   1. Show a preview image in the chat input
   *   2. Send it to the Gemini API (which expects base64-encoded data)
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // FileReader reads the file contents asynchronously
    const reader = new FileReader();

    // Called when the file has been fully read
    reader.onloadend = () => {
      setAttachment({
        file,
        base64: reader.result,         // e.g. "data:image/png;base64,iVBORw0KGgo..."
        mimeType: file.type,           // e.g. "image/png"
        url: URL.createObjectURL(file), // Temporary URL for image previews in the UI
      });
    };

    // Start reading the file as a base64-encoded data URL
    reader.readAsDataURL(file);
  };

  return {
    attachment,
    fileInputRef,
    openFilePicker,
    clearAttachment,
    handleFileInputChange,
  };
}
