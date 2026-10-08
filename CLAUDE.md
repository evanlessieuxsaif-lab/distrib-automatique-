# Friandeasy – notes de déploiement

- Hébergement : Cloudflare Pages (projet `friandeasy`). Chaque push sur `claude/friandeasy-website-omopkj` se déploie sur friandeasy.fr.
- Cache navigateur : `style.css` et `script.js` sont appelés avec `?v=N` dans `index.html`, `mentions-legales.html` et `confidentialite.html`.
  **Incrémenter N dans ces 3 pages à chaque modification de `style.css` ou `script.js`.** Version actuelle : `v=2`.
- `index-standalone.html` embarque tout (CSS, JS, vidéos) : pas de version à gérer, mais le régénérer (voir `video/embed.py`) si les médias changent.
