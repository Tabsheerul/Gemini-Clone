/**
 * models.js — Available AI Models
 *
 * This is the SINGLE place where the list of selectable Gemini models is defined.
 *
 * Why put it here?
 *   Both PromptInput (shows the model picker dropdown) and GeminiContext (uses the
 *   model ID to make API calls) need this information. By keeping it here, we avoid
 *   duplicating the list in two places.
 *
 * To add a new model, just add a new object to this array.
 *
 * Each model has:
 *   id        — the exact string the Gemini API expects
 *   shortName — displayed on the small pill button in the toolbar
 *   full      — displayed in the dropdown list
 */
export const MODELS = [
  { id: 'gemini-3-flash-preview', shortName: 'Gemini 3',         full: 'Gemini 3 Flash (Preview)' },
  { id: 'gemini-2.5-pro',         shortName: 'Gemini 2.5 Pro',   full: 'Gemini 2.5 Pro'           },
  { id: 'gemini-2.5-flash',       shortName: 'Gemini 2.5 Flash', full: 'Gemini 2.5 Flash'          },
];

/** The model ID that is selected when the app first loads. */
export const DEFAULT_MODEL_ID = MODELS[0].id;
