// app.js - Lógica de Dietas VEDAMCI 2026

document.addEventListener('DOMContentLoaded', () => {
    let currentDietKey = 'Vata'; // Dieta inicial por defecto

    const sidebarMenu = document.getElementById('sidebar-menu');
    const dietContent = document.getElementById('diet-content');
    const printBtn = document.getElementById('print-btn');

    // Nombres de alimentos mexicanos para identificar y ponerles la etiqueta "México"
    const listaAlimentosMexicanos = [
        'nopal', 'nopales', 'chicozapote', 'tuna', 'tunas', 'pitaya', 'pitayas', 'pitahaya',
        'piña', 'ejote', 'ejotes', 'calabacita', 'calabacita mexicana', 'chayote', 'jícama',
        'jitomate', 'tomatillo', 'tomatillo verde', 'tomate verde', 'aguacate', 'flor de calabaza',
        'verdolagas', 'chile', 'chiles', 'serrano', 'jalapeño', 'poblano', 'habanero', 'epazote',
        'cilantro', 'hoja santa', 'orégano', 'orégano mexicano', 'maíz', 'tortilla', 'tortillas',
        'tortilla de maíz', 'tortillas de maíz', 'frijol negro', 'frijoles negros', 'frijol bayo',
        'frijoles bayos', 'amaranto', 'chía'
    ];

    // Cargar bases de datos desde data.js
    function loadData() {
        if (typeof dietasData !== 'undefined' && typeof alimentosMexicanos !== 'undefined') {
            initApp();
        } else {
            dietContent.innerHTML = `
                <div class="loading">
                    <p>Error: No se encontraron los datos locales en data.js. Verifica que el archivo exista.</p>
                </div>
            `;
        }
    }

    // Inicializar aplicación
    function initApp() {
        renderSidebar();
        renderDieta(currentDietKey);

        // Evento de impresión a PDF (Genera HTML dedicado para PDF)
        printBtn.addEventListener('click', () => {
            const dieta = dietasData[currentDietKey];
            if (!dieta) return;

            // Indicador de carga visual en el botón
            const originalText = printBtn.innerHTML;
            printBtn.disabled = true;
            printBtn.innerHTML = `
                <svg viewBox="0 0 50 50" style="width:18px;height:18px;animation:spin 1s linear infinite;margin-right:8px;display:inline-block;vertical-align:middle;">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="1, 150" stroke-dashoffset="0" stroke-linecap="round"></circle>
                </svg>
                <span>Generando PDF...</span>
            `;
            if (!document.getElementById('spin-style')) {
                const style = document.createElement('style');
                style.id = 'spin-style';
                style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }

            // Construir HTML dedicado para PDF con estilos inline
            const pdfContainer = buildPdfHtml(dieta, currentDietKey);
            
            // Posicionamos el contenedor directamente en left: 0, top: 0 pero detrás de todo con z-index: -100.
            // Esto asegura coordenadas (0,0) perfectas para la bounding box de html2canvas,
            // mientras se mantiene oculto debajo de la persiana opaca del contenedor principal.
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.left = '0';
            pdfContainer.style.top = '0';
            pdfContainer.style.zIndex = '-100';
            pdfContainer.style.margin = '0';
            document.body.appendChild(pdfContainer);

            const opt = {
                margin:       [8, 8, 8, 8],
                filename:     `Dieta_${currentDietKey}_VEDAMCI_2026.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2,
                    useCORS: true, 
                    logging: false,
                    letterRendering: true,
                    windowWidth: 900,
                    scrollX: 0,
                    scrollY: 0,
                    x: 0,
                    y: 0
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css'], avoid: '.pdf-category-card' }
            };

            // Damos un pequeño delay (150ms) para asegurarnos de que el navegador calcule el layout antes de capturar
            setTimeout(() => {
                html2pdf().set(opt).from(pdfContainer).save().then(() => {
                    document.body.removeChild(pdfContainer);
                    printBtn.disabled = false;
                    printBtn.innerHTML = originalText;
                }).catch(err => {
                    console.error('Error al generar PDF:', err);
                    if (pdfContainer.parentNode) document.body.removeChild(pdfContainer);
                    printBtn.disabled = false;
                    printBtn.innerHTML = originalText;
                    alert('Ocurrió un error al generar el PDF.');
                });
            }, 150);
        });
    }

    // Renderizar barra lateral
    function renderSidebar() {
        sidebarMenu.innerHTML = '';
        Object.keys(dietasData).forEach(key => {
            const li = document.createElement('li');
            li.className = `diet-menu-item ${key === currentDietKey ? 'active' : ''}`;
            
            const btn = document.createElement('button');
            btn.innerHTML = `
                <span>${dietasData[key].nombre}</span>
                <span class="chevron">→</span>
            `;
            
            btn.addEventListener('click', () => {
                // Quitar clase activa de los otros items
                document.querySelectorAll('.diet-menu-item').forEach(item => {
                    item.classList.remove('active');
                });
                li.classList.add('active');
                
                currentDietKey = key;
                renderDieta(key);
            });

            li.appendChild(btn);
            sidebarMenu.appendChild(li);
        });
    }

    // Comprobar si un alimento es mexicano
    function esAlimentoMexicano(nombre) {
        const nombreLower = nombre.toLowerCase();
        return listaAlimentosMexicanos.some(keyword => nombreLower.includes(keyword));
    }

    // Renderizar una dieta específica
    function renderDieta(key) {
        const dieta = dietasData[key];
        if (!dieta) return;

        // Cambiar el tema del body según el dosha
        document.body.className = '';
        const themeClass = `theme-${key.toLowerCase()}`;
        document.body.classList.add(themeClass);

        // Crear cabecera
        let saboresMejorHtml = dieta.sabores.mejor.join(', ');
        let saboresEvitarHtml = dieta.sabores.evitar.join(', ');

        let headerHtml = `
            <div class="diet-header">
                <h1 class="diet-title">${dieta.nombre}</h1>
                <p class="diet-description">${dieta.descripcion}</p>
                <div class="diet-attributes">
                    <div class="attribute-tag mejor">
                        <strong>Mejor:</strong> <span>${saboresMejorHtml}</span>
                    </div>
                    <div class="attribute-tag evitar">
                        <strong>Evitar:</strong> <span>${saboresEvitarHtml}</span>
                    </div>
                </div>
            </div>
        `;

        // Crear contenedor de categorías
        let categoriesHtml = '<div class="categories-container">';

        Object.keys(dieta.categorias).forEach(catName => {
            const cat = dieta.categorias[catName];
            
            categoriesHtml += `
                <div class="category-card" id="cat-${catName.toLowerCase()}">
                    <div class="category-header">
                        <h2 class="category-title">${catName}</h2>
                    </div>
                    ${cat.descripcion_general ? `<p class="category-description">${cat.descripcion_general}</p>` : ''}
                    
                    <div class="lists-grid">
            `;

            // Renderizar columna "Mejor"
            if (cat.mejor && cat.mejor.length > 0) {
                categoriesHtml += `
                    <div class="list-column">
                        <div class="column-title-badge mejor">Mejor / Recomendados</div>
                        <ul class="food-list">
                            ${cat.mejor.map(item => renderFoodItem(item)).join('')}
                        </ul>
                    </div>
                `;
            }

            // Renderizar columna "Moderado / Pequeñas cantidades"
            if (cat.moderado && cat.moderado.length > 0) {
                categoriesHtml += `
                    <div class="list-column">
                        <div class="column-title-badge moderado">Pequeñas cantidades</div>
                        <ul class="food-list">
                            ${cat.moderado.map(item => renderFoodItem(item)).join('')}
                        </ul>
                    </div>
                `;
            } else if (cat.evitar && cat.evitar.length > 0) {
                // Si no hay moderado, ponemos evitar al lado
                categoriesHtml += `
                    <div class="list-column">
                        <div class="column-title-badge evitar">Evitar</div>
                        <ul class="food-list">
                            ${cat.evitar.map(item => renderFoodItem(item)).join('')}
                        </ul>
                    </div>
                `;
            }

            // Si pusimos moderado, y también hay evitar, ponemos evitar debajo o estructurado
            // Para mantener consistencia, mostramos Evitar en una columna o sección
            if (cat.moderado && cat.moderado.length > 0 && cat.evitar && cat.evitar.length > 0) {
                categoriesHtml += `
                    <div class="list-column">
                        <div class="column-title-badge evitar">Evitar</div>
                        <ul class="food-list">
                            ${cat.evitar.map(item => renderFoodItem(item)).join('')}
                        </ul>
                    </div>
                `;
            }

            categoriesHtml += `
                    </div>
                </div>
            `;
        });

        categoriesHtml += '</div>';

        // Pie de página de la dieta
        const footerHtml = `
            <div class="diet-footer-info">
                <p>Estas dietas se basan en los principios de la medicina Ayurvédica tradicional, adaptadas con alimentos locales mexicanos.</p>
                <p>Contacto VEDAMCI Cel: 3311651870 | <a href="https://vedamci.com.mx/" target="_blank">vedamci.com.mx</a></p>
            </div>
        `;

        // Ensamblar todo en el contenedor
        dietContent.innerHTML = headerHtml + categoriesHtml + footerHtml;
    }

    // Helper para renderizar cada alimento en lista
    function renderFoodItem(item) {
        const esMex = esAlimentoMexicano(item.alimento);
        const tagMex = esMex ? `<span class="mexico-tag">🇲🇽 Alimento Local</span>` : '';
        
        return `
            <li class="food-item">
                <span class="food-name">${item.alimento}</span>
                ${item.nota ? `<span class="food-note">${item.nota}</span>` : ''}
                ${tagMex}
            </li>
        `;
    }

    // ============================================================
    // Construir HTML dedicado para exportar a PDF
    // Usa estilos inline simples que html2canvas renderiza bien
    // ============================================================
    function buildPdfHtml(dieta, key) {
        // Colores por dosha (sólidos, sin rgba ni gradientes)
        const doshaColors = {
            'Vata':        { primary: '#3d6a45', light: '#e8f0ea', dark: '#27492d', accent: '#a3b899' },
            'Pitta':       { primary: '#b33927', light: '#fde8e5', dark: '#822214', accent: '#e5a93b' },
            'Kapha':       { primary: '#2b5c74', light: '#e3eff5', dark: '#1b3d4f', accent: '#78a1bb' },
            'Vata-Pitta':  { primary: '#7d5738', light: '#f5ede4', dark: '#523720', accent: '#d2a454' },
            'Vata-Kapha':  { primary: '#3c5266', light: '#e8edf1', dark: '#243545', accent: '#7ca5b8' },
            'Pitta-Kapha': { primary: '#2b6b55', light: '#e3f2ec', dark: '#194535', accent: '#d1b46a' },
            'Tridoshica':  { primary: '#6c4e85', light: '#ede6f3', dark: '#4b3260', accent: '#e5b33b' }
        };
        const c = doshaColors[key] || doshaColors['Tridoshica'];

        const container = document.createElement('div');
        container.id = 'pdf-render-container';
        container.style.cssText = `
            width: 830px; 
            background: #ffffff;
            font-family: 'Outfit', Arial, Helvetica, sans-serif;
            color: #222222;
            line-height: 1.5;
            font-size: 13px;
            padding: 20px 25px;
            box-sizing: border-box;
        `;

        // --- HEADER ---
        let saboresMejor = dieta.sabores.mejor.join(', ');
        let saboresEvitar = dieta.sabores.evitar.join(', ');

        let html = `
            <div style="text-align:center; padding-bottom:20px; margin-bottom:25px; border-bottom:3px solid ${c.primary};">
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:3px; color:${c.primary}; margin-bottom:8px; font-weight:600;">VEDAMCI · Ayurveda México 2026</div>
                <div style="font-family:'Playfair Display',Georgia,serif; font-size:32px; font-weight:700; color:${c.dark}; margin-bottom:10px;">${dieta.nombre}</div>
                <div style="font-size:13px; color:#555555; max-width:700px; margin:0 auto 18px; font-style:italic;">${dieta.descripcion}</div>
                <div style="display:flex; justify-content:center; gap:20px; flex-wrap:wrap;">
                    <div style="display:inline-block; padding:6px 18px; border:1px solid #2e7d32; border-left:4px solid #2e7d32; font-size:12px;">
                        <strong style="color:#2e7d32;">Mejor:</strong> <span>${saboresMejor}</span>
                    </div>
                    <div style="display:inline-block; padding:6px 18px; border:1px solid #c62828; border-left:4px solid #c62828; font-size:12px;">
                        <strong style="color:#c62828;">Evitar:</strong> <span>${saboresEvitar}</span>
                    </div>
                </div>
            </div>
        `;

        // --- CATEGORÍAS ---
        Object.keys(dieta.categorias).forEach(catName => {
            const cat = dieta.categorias[catName];

            html += `<div class="pdf-category-card" style="margin-bottom:22px; page-break-inside:avoid; break-inside:avoid;">`;

            // Título de categoría
            html += `
                <div style="border-bottom:2px solid ${c.primary}; padding-bottom:6px; margin-bottom:12px;">
                    <div style="font-family:'Playfair Display',Georgia,serif; font-size:20px; font-weight:700; color:${c.dark};">${catName}</div>
                </div>
            `;

            // Descripción general
            if (cat.descripcion_general) {
                html += `
                    <div style="background:${c.light}; border-left:4px solid ${c.primary}; padding:8px 14px; margin-bottom:14px; font-size:12px; color:#444444; font-style:italic;">
                        ${cat.descripcion_general}
                    </div>
                `;
            }

            // Determinar columnas
            const columns = [];
            if (cat.mejor && cat.mejor.length > 0) {
                columns.push({ title: 'Mejor / Recomendados', items: cat.mejor, color: '#2e7d32', bgColor: '#e8f5e9' });
            }
            if (cat.moderado && cat.moderado.length > 0) {
                columns.push({ title: 'Pequeñas cantidades', items: cat.moderado, color: '#ef6c00', bgColor: '#fff3e0' });
            }
            if (cat.evitar && cat.evitar.length > 0) {
                columns.push({ title: 'Evitar', items: cat.evitar, color: '#c62828', bgColor: '#ffebee' });
            }

            if (columns.length > 0) {
                const colWidth = Math.floor(100 / columns.length);
                html += `<table style="width:100%; border-collapse:collapse; table-layout:fixed;"><tr>`;
                
                columns.forEach((col, idx) => {
                    html += `<td style="width:${colWidth}%; vertical-align:top; padding:0 ${idx < columns.length - 1 ? '10' : '0'}px 0 ${idx > 0 ? '10' : '0'}px;">`;
                    
                    // Badge del título
                    html += `
                        <div style="display:inline-block; padding:3px 10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:${col.color}; background:${col.bgColor}; border:1px solid ${col.color}; margin-bottom:8px;">
                            ${col.title}
                        </div>
                    `;
                    
                    // Lista de alimentos
                    col.items.forEach(item => {
                        const esMex = esAlimentoMexicano(item.alimento);
                        html += `
                            <div style="padding:5px 8px; margin-bottom:4px; background:${c.light}; border:1px solid #e0e0e0; font-size:12px;">
                                <span style="font-weight:600; color:${c.dark};">${item.alimento}</span>
                                ${item.nota ? `<span style="color:#666666; font-size:11px;"> — ${item.nota}</span>` : ''}
                                ${esMex ? `<span style="display:inline-block; font-size:9px; font-weight:700; color:#00796b; border:1px solid #00796b; padding:0 4px; margin-left:4px; vertical-align:middle;">🇲🇽 MX</span>` : ''}
                            </div>
                        `;
                    });

                    html += `</td>`;
                });

                html += `</tr></table>`;
            }

            html += `</div>`; // fin pdf-category-card
        });

        // --- FOOTER ---
        html += `
            <div style="margin-top:25px; padding-top:15px; border-top:2px solid ${c.primary}; text-align:center; font-size:11px; color:#777777;">
                <div>Estas dietas se basan en los principios de la medicina Ayurvédica tradicional, adaptadas con alimentos locales mexicanos.</div>
                <div style="margin-top:5px;">Contacto VEDAMCI · Cel: 3311651870 · vedamci.com.mx</div>
            </div>
        `;

        container.innerHTML = html;
        return container;
    }

    loadData();
});
