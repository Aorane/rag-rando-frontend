/**
 * Nettoie un texte en remplaçant les entités HTML et en supprimant les balises.
 */
export const cleanText = (text: string): string => {
  if (!text) return '';

  // Table de conversion des entités HTML courantes
  const htmlEntities: { [key: string]: string } = {
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&agrave;': 'à',
    '&ecirc;': 'ê',
    '&ocirc;': 'ô',
    '&icirc;': 'î',
    '&acirc;': 'â',
    '&ucirc;': 'û',
    '&ccedil;': 'ç',
    '&euml;': 'ë',
    '&iuml;': 'ï',
    '&uuml;': 'ü',
    '&deg;': '°',
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&euro;': '€',
    '&oelig;': 'œ',
    '&aelig;': 'æ',
    '&rsquo;': ''
  };

  // Remplacer toutes les entités HTML
  let cleanedText = text;
  Object.entries(htmlEntities).forEach(([entity, char]) => {
    cleanedText = cleanedText.replace(new RegExp(entity, 'g'), char);
  });

  // Nettoyer les balises HTML et normaliser les espaces/sauts de ligne
  return cleanedText
    .replace(/<br\s*\/?>/g, '\n')  // Remplacer les <br> par des sauts de ligne
    .replace(/<[^>]*>/g, '')       // Supprimer toutes les autres balises HTML
    .replace(/\n+/g, '\n')         // Remplacer les multiples sauts de ligne par un seul
    .replace(/\s+/g, ' ')          // Remplacer les espaces multiples par un seul
    .trim();
};

/**
 * Formate une durée en heures sous forme "1h30" ou "45min".
 */
export const formatDuration = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m}min`;
};

/**
 * Retourne l'icône correspondant à une pratique.
 */
export const getPratiqueIcon = (pratique: string): string => {
  const icons: { [key: string]: string } = {
    pédestre: '🚶',
    trail: '🏃',
    VTT: '🚵',
    cyclo: '🚴',
    gravel: '🚲',
    équestre: '🐎',
    'ski de fond': '⛷️',
    'ski de rando': '🎿',
    raquettes: '❄️',
    autre: '➡️'
  };
  return icons[pratique] || '➡️';
};

/**
 * Retourne les classes de couleur pour la difficulté.
 */
export const getDifficultyColor = (difficulte: string): string => {
  switch (difficulte) {
    case 'Facile':
      return 'bg-green-100 text-green-800';
    case 'Modéré':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-red-100 text-red-800';
  }
}; 


// Fonction utilitaire pour nettoyer le texte
// export const cleanText = (text: string) => {
//   if (!text) return '';
  
//   // Table de conversion des entités HTML courantes
//   const htmlEntities: { [key: string]: string } = {
//     '&eacute;': 'é',
//     '&egrave;': 'è',
//     '&agrave;': 'à',
//     '&ecirc;': 'ê',
//     '&ocirc;': 'ô',
//     '&icirc;': 'î',
//     '&acirc;': 'â',
//     '&ucirc;': 'û',
//     '&ccedil;': 'ç',
//     '&euml;': 'ë',
//     '&iuml;': 'ï',
//     '&uuml;': 'ü',
//     '&deg;': '°',
//     '&nbsp;': ' ',
//     '&amp;': '&',
//     '&lt;': '<',
//     '&gt;': '>',
//     '&quot;': '"',
//     '&apos;': "'",
//     '&euro;': '€',
//     '&oelig;': 'œ',
//     '&aelig;': 'æ',
//     '&rsquo;':''
//   };

//   // Remplacer toutes les entités HTML
//   let cleanedText = text;
//   Object.entries(htmlEntities).forEach(([entity, char]) => {
//     cleanedText = cleanedText.replace(new RegExp(entity, 'g'), char);
//   });

//   // Nettoyer les balises HTML et la mise en forme
//   return cleanedText
//     .replace(/<br\s*\/?>/g, '\n')  // Remplace les <br> par des sauts de ligne
//     .replace(/<[^>]*>/g, '')       // Supprime toutes les autres balises HTML
//     .replace(/\n+/g, '\n')         // Remplace les sauts de ligne multiples par un seul
//     .replace(/\s+/g, ' ')          // Remplace les espaces multiples par un seul
//     .trim();                       // Supprime les espaces au début et à la fin
// };