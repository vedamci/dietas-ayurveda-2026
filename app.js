// app.js - Lógica de Dietas VEDAMCI 2026

document.addEventListener('DOMContentLoaded', () => {
    let currentDietKey = 'Vata'; // Dieta inicial por defecto

    const sidebarMenu = document.getElementById('sidebar-menu');
    const dietContent = document.getElementById('diet-content');
    const printBtn = document.getElementById('print-btn');
    const PDF_RENDER_WIDTH = 760;

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

            // Construir una plantilla dedicada para PDF
            const pdfContainer = buildPdfHtml(dieta, currentDietKey);

            // Creamos un contenedor wrapper posicionado fuera de la pantalla
            // para que el navegador calcule el layout sin que el usuario lo vea.
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-9999px';
            wrapper.style.top = '0';
            wrapper.style.width = `${PDF_RENDER_WIDTH}px`;
            wrapper.style.overflow = 'hidden';
            
            wrapper.appendChild(pdfContainer);
            document.body.appendChild(wrapper);

            const opt = {
                margin:       [10, 11, 12, 11],
                filename:     `Dieta_${currentDietKey}_VEDAMCI_2026.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2,
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    logging: false,
                    letterRendering: true,
                    windowWidth: PDF_RENDER_WIDTH,
                    width: PDF_RENDER_WIDTH
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
                pagebreak:    {
                    mode: ['css', 'legacy'],
                    avoid: ['.pdf-keep-together', '.pdf-food-row', '.pdf-column-heading']
                }
            };

            // Damos un pequeño delay (150ms) para asegurarnos de que el navegador calcule el layout antes de capturar
            setTimeout(() => {
                html2pdf().set(opt).from(pdfContainer).save().then(() => {
                    document.body.removeChild(wrapper);
                    printBtn.disabled = false;
                    printBtn.innerHTML = originalText;
                }).catch(err => {
                    console.error('Error al generar PDF:', err);
                    if (wrapper.parentNode) document.body.removeChild(wrapper);
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

    function escapeHtml(value) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return String(value ?? '').replace(/[&<>"']/g, char => escapeMap[char]);
    }

    // ============================================================
    // Construir HTML dedicado para exportar a PDF
    // Estructura estable para A4, márgenes consistentes y cortes limpios
    // ============================================================
    function buildPdfHtml(dieta, key) {
        // Colores por dosha (sólidos, sin rgba ni gradientes)
        const doshaColors = {
            'Vata':        { primary: '#3d6a45', light: '#eef5ef', dark: '#27492d', accent: '#a3b899' },
            'Pitta':       { primary: '#b33927', light: '#fbebe8', dark: '#822214', accent: '#d69b35' },
            'Kapha':       { primary: '#2b5c74', light: '#e9f2f6', dark: '#1b3d4f', accent: '#78a1bb' },
            'Vata-Pitta':  { primary: '#7d5738', light: '#f5eee6', dark: '#523720', accent: '#c99745' },
            'Vata-Kapha':  { primary: '#3c5266', light: '#edf2f5', dark: '#243545', accent: '#7ca5b8' },
            'Pitta-Kapha': { primary: '#2b6b55', light: '#e9f4ef', dark: '#194535', accent: '#c4a75c' },
            'Tridoshica':  { primary: '#6c4e85', light: '#f0eaf5', dark: '#4b3260', accent: '#d2a431' }
        };
        const c = doshaColors[key] || doshaColors['Tridoshica'];
        const neutral = {
            ink: '#2b2622',
            muted: '#625b54',
            soft: '#f8f5f1',
            line: '#e6ddd3'
        };

        const container = document.createElement('div');
        container.id = 'pdf-render-container';
        container.style.cssText = `
            width: ${PDF_RENDER_WIDTH}px;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            color: ${neutral.ink};
            line-height: 1.42;
            font-size: 12px;
            padding: 0;
            box-sizing: border-box;
        `;

        const styles = `
            <style>
                #pdf-render-container * {
                    box-sizing: border-box;
                }

                #pdf-render-container .pdf-keep-together,
                #pdf-render-container .pdf-food-row,
                #pdf-render-container .pdf-column-heading {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                #pdf-render-container .pdf-section-heading,
                #pdf-render-container .pdf-column-heading {
                    page-break-after: avoid;
                    break-after: avoid;
                }

                #pdf-render-container .pdf-category {
                    page-break-inside: auto;
                    break-inside: auto;
                }
            </style>
        `;

        const saboresMejor = escapeHtml(dieta.sabores.mejor.join(', '));
        const saboresEvitar = escapeHtml(dieta.sabores.evitar.join(', '));

        let html = styles + `
            <section class="pdf-cover pdf-keep-together" style="border:1px solid ${neutral.line}; border-top:7px solid ${c.primary}; margin-bottom:18px; background:${neutral.soft};">
                <div style="padding:20px 24px 18px 24px;">
                    <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
                        <tr>
                            <td style="width:50%; vertical-align:middle; color:${c.dark}; font-size:11px; font-weight:700;">VEDAMCI</td>
                            <td style="width:50%; vertical-align:middle; text-align:right; color:${neutral.muted}; font-size:10px;">Ayurveda México 2026</td>
                        </tr>
                    </table>
                    <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:31px; line-height:1.08; color:${c.dark}; margin:0 0 10px 0; font-weight:700;">${escapeHtml(dieta.nombre)}</h1>
                    <p style="font-size:12.3px; line-height:1.55; color:${neutral.muted}; margin:0 0 16px 0; max-width:690px;">${escapeHtml(dieta.descripcion)}</p>
                    <table style="width:100%; border-collapse:separate; border-spacing:0; table-layout:fixed;">
                        <tr>
                            <td style="width:50%; vertical-align:top; padding:10px 12px; background:#ffffff; border-left:4px solid #2e7d32; border-top:1px solid ${neutral.line}; border-bottom:1px solid ${neutral.line}; border-right:6px solid ${neutral.soft};">
                                <div style="font-size:9px; font-weight:700; color:#2e7d32; margin-bottom:4px;">Mejor</div>
                                <div style="font-size:11px; color:${neutral.ink}; line-height:1.42;">${saboresMejor}</div>
                            </td>
                            <td style="width:50%; vertical-align:top; padding:10px 12px; background:#ffffff; border-left:4px solid #c62828; border-top:1px solid ${neutral.line}; border-bottom:1px solid ${neutral.line};">
                                <div style="font-size:9px; font-weight:700; color:#c62828; margin-bottom:4px;">Evitar</div>
                                <div style="font-size:11px; color:${neutral.ink}; line-height:1.42;">${saboresEvitar}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </section>
        `;

        function renderPdfFoodRows(items) {
            return items.map(item => {
                const esMex = esAlimentoMexicano(item.alimento);
                const noteHtml = item.nota
                    ? `<div style="font-size:10.3px; color:${neutral.muted}; line-height:1.34; margin-top:1px;">${escapeHtml(item.nota)}</div>`
                    : '';
                const mexTag = esMex
                    ? `<span style="display:inline-block; font-size:8px; line-height:1; font-weight:700; color:#00796b; border:1px solid #80b8ad; padding:2px 4px; margin-left:5px; vertical-align:1px;">MX</span>`
                    : '';

                return `
                    <div class="pdf-food-row" style="padding:5px 0 6px 0; border-bottom:1px solid ${neutral.line};">
                        <div style="font-size:11.3px; line-height:1.28; font-weight:700; color:${c.dark};">${escapeHtml(item.alimento)}${mexTag}</div>
                        ${noteHtml}
                    </div>
                `;
            }).join('');
        }

        Object.keys(dieta.categorias).forEach((catName, index) => {
            const cat = dieta.categorias[catName];
            const sectionNumber = String(index + 1).padStart(2, '0');

            html += `
                <section class="pdf-category" style="margin:0 0 17px 0; padding:0 0 14px 0; border-bottom:1px solid ${neutral.line};">
                    <div class="pdf-section-heading pdf-keep-together" style="display:table; width:100%; border-collapse:collapse; margin-bottom:9px;">
                        <div style="display:table-cell; width:38px; vertical-align:middle; color:${c.primary}; font-size:10px; font-weight:700; border-top:2px solid ${c.primary}; padding-top:6px;">${sectionNumber}</div>
                        <div style="display:table-cell; vertical-align:middle; border-top:2px solid ${c.primary}; padding-top:4px;">
                            <h2 style="font-family:Georgia,'Times New Roman',serif; font-size:19px; line-height:1.16; color:${c.dark}; margin:0; font-weight:700;">${escapeHtml(catName)}</h2>
                        </div>
                    </div>
            `;

            if (cat.descripcion_general) {
                html += `
                    <div class="pdf-keep-together" style="background:${c.light}; border-left:4px solid ${c.primary}; padding:8px 11px; margin-bottom:11px; font-size:11px; color:${neutral.muted}; line-height:1.42;">
                        ${escapeHtml(cat.descripcion_general)}
                    </div>
                `;
            }

            const columns = [];
            if (cat.mejor && cat.mejor.length > 0) {
                columns.push({ title: 'Mejor / recomendados', items: cat.mejor, color: '#2e7d32', bgColor: '#edf7ee' });
            }
            if (cat.moderado && cat.moderado.length > 0) {
                columns.push({ title: 'Pequeñas cantidades', items: cat.moderado, color: '#b86200', bgColor: '#fff4e3' });
            }
            if (cat.evitar && cat.evitar.length > 0) {
                columns.push({ title: 'Evitar', items: cat.evitar, color: '#c62828', bgColor: '#fdebed' });
            }

            if (columns.length > 0) {
                const colWidth = 100 / columns.length;
                html += `<table style="width:100%; border-collapse:collapse; table-layout:fixed;"><tr>`;

                columns.forEach((col, idx) => {
                    html += `
                        <td style="width:${colWidth}%; vertical-align:top; padding:0 ${idx < columns.length - 1 ? '8px' : '0'} 0 ${idx > 0 ? '8px' : '0'};">
                            <div class="pdf-column-heading" style="font-size:9px; line-height:1.1; font-weight:700; color:${col.color}; background:${col.bgColor}; border:1px solid ${col.color}; border-radius:4px; padding:5px 7px; margin-bottom:5px;">
                                ${escapeHtml(col.title)}
                            </div>
                            ${renderPdfFoodRows(col.items)}
                        </td>
                    `;
                });

                html += `</tr></table>`;
            }

            html += `
                </section>
            `;
        });

        html += `
            <footer class="pdf-keep-together" style="margin-top:18px; padding:12px 0 0 0; border-top:2px solid ${c.primary}; text-align:center; color:${neutral.muted}; font-size:10.5px; line-height:1.45;">
                <div>Estas dietas se basan en los principios de la medicina Ayurvédica tradicional, adaptadas con alimentos locales mexicanos.</div>
                <div style="margin-top:4px; color:${c.dark}; font-weight:700;">Contacto VEDAMCI · Cel: 3311651870 · vedamci.com.mx</div>
            </footer>
        `;

        container.innerHTML = html;
        return container;
    }

    loadData();
});
