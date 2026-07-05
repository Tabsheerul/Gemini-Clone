import { useState, useRef } from 'react';

/**
 * useSpeechRecognition — Custom Hook
 *
 * This hook encapsulates ALL microphone / speech-to-text logic.
 *
 * Why a custom hook?
 *   Before this refactor, all of this logic lived directly inside PromptInput.jsx,
 *   making that file long and hard to read. A custom hook lets PromptInput simply say
 *   "give me the isRecording state and the startListening function" — it doesn't need
 *   to know anything about HOW speech recognition actually works.
 *
 * Usage:
 *   const { isRecording, startOrStopListening } = useSpeechRecognition({ onTranscript });
 *
 * @param {object} options
 * @param {Function} options.onTranscript - Called whenever the recognized speech text updates.
 *   Receives (transcript: string) where transcript is the new speech heard since recording started.
 *   The parent component decides what to do with it (usually: append to the textarea text).
 *
 * @returns {{ isRecording: boolean, startOrStopListening: Function }}
 */
export function useSpeechRecognition({ onTranscript }) {
  // True while the mic is actively listening
  const [isRecording, setIsRecording] = useState(false);

  // We keep a ref to the recognition instance so we can call .stop() on it
  const recognitionRef = useRef(null);

  /**
   * Toggles the microphone on/off.
   * - If already recording → stops.
   * - If not recording → checks for browser support, then starts listening.
   */
  const startOrStopListening = () => {
    // ── STOP: if we're already recording, stop it ──
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // ── START: check if this browser supports speech recognition ──
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();

    // Use the browser's current language (e.g. 'en-US', 'hi-IN', etc.)
    recognition.lang = window.navigator.language || 'en-US';

    // continuous: false = recognition stops automatically after a pause in speech
    // (more reliable across browsers than keeping it running forever)
    recognition.continuous = false;

    // interimResults: true = we get partial results while the user is still speaking,
    // which makes the UI feel more responsive
    recognition.interimResults = true;

    // Save the ref so we can call .stop() later if the user clicks the button again
    recognitionRef.current = recognition;

    // ── Event: mic has started listening ──
    recognition.onstart = () => {
      console.log('Mic started listening...');
      setIsRecording(true);
    };

    // ── Event: speech was heard ──
    recognition.onresult = (event) => {
      // Combine all recognized results into a single string
      // (There can be multiple results if the user paused mid-sentence)
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');

      console.log('Speech heard:', transcript);

      // Tell the parent component what was heard so it can update the textarea
      onTranscript(transcript);
    };

    // ── Event: something went wrong ──
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      // Show a human-readable message for the most common errors
      if (event.error === 'no-speech') {
        alert('No speech was detected. Please make sure your microphone is working and not muted.');
      } else if (event.error === 'audio-capture') {
        alert('No microphone was found. Please ensure a microphone is plugged in.');
      } else if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access in your browser settings.');
      }

      setIsRecording(false);
    };

    // ── Event: recognition ended (either naturally or via .stop()) ──
    recognition.onend = () => {
      setIsRecording(false);
    };

    // Start listening!
    recognition.start();
  };

  return { isRecording, startOrStopListening };
}
