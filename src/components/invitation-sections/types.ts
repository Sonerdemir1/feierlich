// Gemeinsame Typen fuer den One-Page-Abschnitts-Baukasten (siehe Plan
// "polymorphic-moseying-piglet.md"). Farben kommen 1:1 aus dem, was
// DesignStudio.tsx (draft.primary/accent/background) bzw. spaeter die echte
// Event-Seite (colorOverride/Template.colors) ohnehin schon fuehren.
export type IvColors = {
  primary: string;
  accent: string;
  background: string;
};

// Fuer Stellen, die nicht per contentEditable getippt werden (Ort/Datum) —
// ein Klick oeffnet stattdessen ein Mini-Formular im Panel (PlaceAutocomplete-
// Feld bzw. DateQuickEdit), gleiches Prinzip wie SelectableElement kind="date".
export type ClickField = {
  display: string;
  selected: boolean;
  onSelect: () => void;
};
