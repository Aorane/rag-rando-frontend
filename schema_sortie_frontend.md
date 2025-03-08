# Schéma de sortie pour l'intégration frontend

Ce document décrit la structure de données retournée par les endpoints `/conversation` et `/rag-conversation` pour faciliter l'intégration dans le frontend.

## Structure générale

```json
{
  "response": "Réponse textuelle simple pour la compatibilité",
  "messages": [
    {
      "role": "user",
      "content": "Message de l'utilisateur"
    },
    {
      "role": "assistant",
      "content": "Réponse de l'assistant"
    }
  ],
  "analysis": {
    "should_search": true,
    "search_params": { /* paramètres de recherche */ },
    "results_count": 5
  },
  "synthese": "Résumé des résultats de recherche",
  "randonnees": [
    {
      "nom": "Nom de la randonnée",
      "longueur_km": 5.6,
      "difficulte": "facile",
      "duree_h": 2.5,
      "denivele_m": 150,
      "description": "Description de la randonnée",
      "points_forts": [
        "Point fort 1: détail",
        "Point fort 2: détail",
        "Point fort 3: détail"
      ],
      "themes": ["cascade", "forêt", "montagne"]
    }
  ],
  "recommandations": [
    /* Même structure que randonnees, mais contient seulement 1-2 randonnées recommandées */
  ],
  "nombre_resultats": 5,
  "criteres_recherche": {
    "semantic_text": "Texte de recherche",
    "location": "Localisation",
    "distance_max_from_location": null,
    "filters": {
      "pratique": "pédestre",
      "difficulte": "facile",
      "longueur": {
        "max": 10000
      },
      "themes": ["cascade"]
    }
  }
}
```

## Détail des champs

### Champs principaux

| Champ | Type | Description |
|-------|------|-------------|
| `response` | string | Réponse textuelle simple (pour compatibilité) |
| `messages` | array | Historique des messages de la conversation |
| `analysis` | object | Informations d'analyse de la requête (optionnel) |
| `synthese` | string | Résumé des résultats de recherche |
| `randonnees` | array | Liste de toutes les randonnées trouvées |
| `recommandations` | array | Liste des randonnées recommandées (1-2 max) |
| `nombre_resultats` | number | Nombre total de résultats trouvés |
| `criteres_recherche` | object | Critères utilisés pour la recherche |

### Structure de `randonnees` et `recommandations`

Chaque randonnée est représentée par un objet contenant :

| Champ | Type | Description |
|-------|------|-------------|
| `nom` | string | Nom de la randonnée |
| `longueur_km` | number | Longueur en kilomètres |
| `difficulte` | string | Niveau de difficulté (facile, moyen, difficile) |
| `duree_h` | number | Durée en heures |
| `denivele_m` | number | Dénivelé positif en mètres |
| `description` | string | Description détaillée de la randonnée |
| `points_forts` | array | Liste des points forts (3-5 éléments) |
| `themes` | array | Thèmes de la randonnée (cascade, forêt, etc.) |

## Utilisation dans le frontend

### Affichage des résultats

1. **Synthèse** : Afficher `synthese` comme résumé principal
2. **Liste des randonnées** : Utiliser `randonnees` pour afficher toutes les options
3. **Recommandations** : Mettre en avant les randonnées de `recommandations`
4. **Filtres utilisés** : Afficher `criteres_recherche` pour montrer les filtres appliqués

### Exemple de mise en page

```jsx
// Exemple React simplifié
function RandoResults({ data }) {
  return (
    <div className="results-container">
      <div className="summary">
        <h2>Résultats pour votre recherche</h2>
        <p>{data.synthese}</p>
        
        <div className="search-criteria">
          <h3>Critères appliqués</h3>
          <ul>
            <li>Recherche : {data.criteres_recherche.semantic_text}</li>
            <li>Localisation : {data.criteres_recherche.location}</li>
            <li>Difficulté : {data.criteres_recherche.filters.difficulte || "Toutes"}</li>
            {data.criteres_recherche.filters.longueur.max && 
              <li>Longueur max : {data.criteres_recherche.filters.longueur.max/1000} km</li>
            }
            <li>Thèmes : {data.criteres_recherche.filters.themes.join(", ")}</li>
          </ul>
        </div>
      </div>

      {data.recommandations.length > 0 && (
        <div className="recommendations">
          <h2>Recommandations</h2>
          {data.recommandations.map(rando => (
            <RandoCard 
              key={rando.nom} 
              rando={rando} 
              isRecommended={true} 
            />
          ))}
        </div>
      )}

      <div className="all-results">
        <h2>Toutes les randonnées ({data.nombre_resultats})</h2>
        {data.randonnees.map(rando => (
          <RandoCard 
            key={rando.nom} 
            rando={rando} 
            isRecommended={false} 
          />
        ))}
      </div>
    </div>
  );
}

function RandoCard({ rando, isRecommended }) {
  return (
    <div className={`rando-card ${isRecommended ? 'recommended' : ''}`}>
      <h3>{rando.nom}</h3>
      <div className="rando-specs">
        <span>{rando.longueur_km} km</span>
        <span>{rando.difficulte}</span>
        <span>{rando.duree_h} h</span>
        <span>{rando.denivele_m} m dénivelé</span>
      </div>
      <p>{rando.description}</p>
      
      <div className="points-forts">
        <h4>Points forts</h4>
        <ul>
          {rando.points_forts.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>
      
      <div className="themes">
        {rando.themes.map(theme => (
          <span key={theme} className="theme-tag">{theme}</span>
        ))}
      </div>
    </div>
  );
}
```

## Gestion des erreurs

- Si `randonnees` est vide, affichez un message indiquant qu'aucun résultat n'a été trouvé
- Si `nombre_resultats` est 0, utilisez la `synthese` pour expliquer pourquoi (peut contenir des suggestions)
- En cas d'échec du LLM à fournir une réponse JSON structurée, les champs `randonnees` et `recommandations` contiendront une entrée par défaut avec un message explicatif 