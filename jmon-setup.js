/**
 * jmon-setup.js - Single-cell JMON ecosystem setup for Observable
 * 
 * Copy this entire block into a single Observable cell:
 * 
 * jmon = {
 *   // Load script and return global variable
 *   const loadScript = async (url, globalName) => {
 *     // Check if already loaded
 *     if (window[globalName]) return window[globalName];
 *     
 *     const script = document.createElement('script');
 *     script.src = url;
 *     script.crossOrigin = 'anonymous';
 *     document.head.appendChild(script);
 *     
 *     await new Promise((resolve, reject) => {
 *       script.onload = () => setTimeout(resolve, 300);
 *       script.onerror = reject;
 *     });
 *     
 *     return window[globalName] || null;
 *   };
 *   
 *   // Load all dependencies using script tags
 *   const [Tone, ABCJS, dj, jmonTone, jmonAbc] = await Promise.all([
 *     loadScript('https://unpkg.com/tone@15.1.22/build/Tone.js', 'Tone'),
 *     loadScript('https://unpkg.com/abcjs@6/dist/abcjs-basic-min.js', 'ABCJS'),
 *     loadScript('https://cdn.jsdelivr.net/gh/jmonlabs/djalgojs@main/dist/djalgojs.js', 'djalgojs'),
 *     loadScript('https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-tone.js', 'jmonTone'),
 *     loadScript('https://cdn.jsdelivr.net/gh/jmonlabs/jmon-format@main/jmon-abc.js', 'JmonToAbc')
 *   ]);
 *   
 *   // Initialize Tone.js if available
 *   if (Tone && Tone.context && Tone.context.state !== 'running') {
 *     await Tone.start();
 *   }
 *   
 *   // Create API functions using existing JMON utilities
 *   const show = function(composition, options = {}) {
 *     const container = document.createElement('div');
 *     container.style.cssText = `
 *       padding: 16px; border: 1px solid #d1d5db; border-radius: 8px;
 *       background: white; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
 *       margin: 8px 0;
 *     `;
 *     
 *     try {
 *       const normalized = jmonTone?.normalize ? jmonTone.normalize(composition) : composition;
 *       
 *       if (normalized.metadata?.name) {
 *         const title = document.createElement('h3');
 *         title.textContent = normalized.metadata.name;
 *         title.style.cssText = 'margin: 0 0 12px 0; font-size: 16px;';
 *         container.appendChild(title);
 *       }
 *       
 *       const content = jmonAbc?.convertToAbc ? 
 *         jmonAbc.convertToAbc(normalized) : 
 *         JSON.stringify(normalized, null, 2);
 *       
 *       const pre = document.createElement('pre');
 *       pre.textContent = content;
 *       pre.style.cssText = `
 *         background: #f8fafc; padding: 12px; border-radius: 6px;
 *         font-size: 11px; font-family: monospace; overflow: auto;
 *         max-height: 300px; margin: 0;
 *       `;
 *       container.appendChild(pre);
 *       
 *     } catch (error) {
 *       container.innerHTML = `<strong>Error:</strong> ${error.message}`;
 *       container.style.color = '#dc2626';
 *     }
 *     
 *     return container;
 *   };
 *   
 *   const play = function(composition, options = {}) {
 *     const container = document.createElement('div');
 *     container.style.cssText = `
 *       padding: 16px; border: 1px solid #d1d5db; border-radius: 8px;
 *       background: white; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
 *       margin: 8px 0; display: flex; align-items: center; gap: 12px;
 *     `;
 *     
 *     try {
 *       const normalized = jmonTone?.normalize ? jmonTone.normalize(composition) : composition;
 *       
 *       const title = document.createElement('div');
 *       title.textContent = normalized.metadata?.name || 'JMON Composition';
 *       title.style.cssText = 'font-weight: 500; flex: 1;';
 *       container.appendChild(title);
 *       
 *       const playBtn = document.createElement('button');
 *       playBtn.innerHTML = '▶️ Play';
 *       playBtn.style.cssText = `
 *         background: #3b82f6; color: white; border: none;
 *         padding: 8px 16px; border-radius: 6px; cursor: pointer;
 *       `;
 *       
 *       const status = document.createElement('span');
 *       status.textContent = (Tone && jmonTone) ? 'Ready' : 'Audio not available';
 *       status.style.cssText = 'font-size: 12px; color: #6b7280;';
 *       
 *       playBtn.onclick = async () => {
 *         if (!Tone || !jmonTone) {
 *           status.textContent = 'Audio not available';
 *           return;
 *         }
 *         
 *         try {
 *           playBtn.disabled = true;
 *           status.textContent = 'Playing...';
 *           await jmonTone.playComposition(composition);
 *           status.textContent = 'Finished';
 *         } catch (error) {
 *           status.textContent = `Error: ${error.message}`;
 *         } finally {
 *           playBtn.disabled = false;
 *         }
 *       };
 *       
 *       container.appendChild(playBtn);
 *       container.appendChild(status);
 *       
 *     } catch (error) {
 *       container.innerHTML = `<strong>Error:</strong> ${error.message}`;
 *       container.style.color = '#dc2626';
 *     }
 *     
 *     return container;
 *   };
 *   
 *   const display = function(composition, options = {}) {
 *     const container = document.createElement('div');
 *     container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
 *     container.appendChild(show(composition, options));
 *     container.appendChild(play(composition, options));
 *     return container;
 *   };
 *   
 *   return {
 *     Tone, ABCJS, dj, viz: dj,
 *     jmonTone, jmonAbc,
 *     show, play, display
 *   };
 * }
 */