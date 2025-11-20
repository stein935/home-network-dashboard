// Neo-Brutalism-friendly color palette for sticky notes
export const NOTE_COLORS = [
  '#FBBF24', // Bright yellow
  '#F472B6', // Pink
  '#FB923C', // Orange
  '#34D399', // Emerald
  '#60A5FA', // Blue
  '#A78BFA', // Purple
  '#4ADE80', // Lime
  '#2DD4BF', // Cyan
  '#F87171', // Red
  '#C084FC', // Lavender
];

// Get a random color from the palette
export const getRandomColor = () => {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
};

// Validate if a color is in the palette
export const isValidNoteColor = (color) => {
  return NOTE_COLORS.includes(color.toUpperCase());
};
