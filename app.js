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

        // Evento de descarga a PDF vectorial
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

            setTimeout(() => {
                try {
                    downloadDietaPdf(dieta, currentDietKey);
                } catch (err) {
                    console.error('Error al generar PDF:', err);
                    alert('Ocurrió un error al generar el PDF.');
                } finally {
                    printBtn.disabled = false;
                    printBtn.innerHTML = originalText;
                }
            }, 50);
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

    function getFlavorSummary(dieta) {
        const sabores = dieta.sabores || {};
        const toList = value => Array.isArray(value) ? value.filter(Boolean) : [];
        const mejor = toList(sabores.mejor);
        const moderado = toList(sabores.moderado);
        const evitar = toList(sabores.evitar);
        const mejorText = [
            mejor.join(', '),
            moderado.length ? `Moderado: ${moderado.join(', ')}` : ''
        ].filter(Boolean).join(' · ') || 'Según evaluación individual';

        return {
            mejorText,
            evitarText: evitar.length ? evitar.join(', ') : (sabores.nota || 'Evitar excesos y mantener proporciones moderadas.'),
            evitarLabel: evitar.length ? 'Evitar' : 'Nota'
        };
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
        const flavorSummary = getFlavorSummary(dieta);
        let saboresMejorHtml = flavorSummary.mejorText;
        let saboresEvitarHtml = flavorSummary.evitarText;

        let headerHtml = `
            <div class="diet-header">
                <h1 class="diet-title">${dieta.nombre}</h1>
                <p class="diet-description">${dieta.descripcion}</p>
                <div class="diet-attributes">
                    <div class="attribute-tag mejor">
                        <strong>Mejor:</strong> <span>${saboresMejorHtml}</span>
                    </div>
                    <div class="attribute-tag evitar">
                        <strong>${flavorSummary.evitarLabel}:</strong> <span>${saboresEvitarHtml}</span>
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

    function getPdfTheme(key) {
        const doshaColors = {
            'Vata':        { primary: '#3d6a45', light: '#eef5ef', dark: '#27492d', accent: '#a3b899' },
            'Pitta':       { primary: '#b33927', light: '#fbebe8', dark: '#822214', accent: '#d69b35' },
            'Kapha':       { primary: '#2b5c74', light: '#e9f2f6', dark: '#1b3d4f', accent: '#78a1bb' },
            'Vata-Pitta':  { primary: '#7d5738', light: '#f5eee6', dark: '#523720', accent: '#c99745' },
            'Vata-Kapha':  { primary: '#3c5266', light: '#edf2f5', dark: '#243545', accent: '#7ca5b8' },
            'Pitta-Kapha': { primary: '#2b6b55', light: '#e9f4ef', dark: '#194535', accent: '#c4a75c' },
            'Tridoshica':  { primary: '#6c4e85', light: '#f0eaf5', dark: '#4b3260', accent: '#d2a431' }
        };

        return {
            ...(doshaColors[key] || doshaColors['Tridoshica']),
            ink: '#2b2622',
            muted: '#625b54',
            soft: '#f8f5f1',
            line: '#e6ddd3',
            white: '#ffffff',
            green: '#2e7d32',
            orange: '#b86200',
            red: '#c62828',
            teal: '#00796b'
        };
    }

    function downloadDietaPdf(dieta, key) {
        const bytes = createDietaPdfBytes(dieta, key);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Dieta_${key}_VEDAMCI_2026.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
    }

    function createDietaPdfBytes(dieta, key) {
        const theme = getPdfTheme(key);
        const pdf = createPdfRenderer(theme);

        drawPdfCover(pdf, dieta, theme);

        Object.keys(dieta.categorias).forEach((catName, index) => {
            drawPdfCategory(pdf, catName, dieta.categorias[catName], index + 1, theme);
        });

        drawPdfClosingNote(pdf, theme);
        return pdf.finish();
    }

    function createPdfRenderer(theme) {
        const page = {
            width: 595.28,
            height: 841.89,
            marginTop: 38,
            marginRight: 42,
            marginBottom: 48,
            marginLeft: 42
        };
        const pages = [];
        let stream = '';
        let y = page.marginTop;

        function append(command) {
            stream += command;
        }

        function addPage() {
            if (stream) {
                pages.push(stream);
            }
            stream = '';
            y = page.marginTop;
        }

        function ensureSpace(height) {
            if (y + height > page.height - page.marginBottom) {
                addPage();
            }
        }

        function rect(x, yTop, width, height, fill, stroke, lineWidth = 0.75) {
            const yPdf = page.height - yTop - height;
            const operation = fill && stroke ? 'B' : fill ? 'f' : 'S';
            let command = 'q\n';
            if (fill) command += `${pdfColor(fill)} rg\n`;
            if (stroke) command += `${pdfColor(stroke)} RG\n`;
            command += `${formatNumber(lineWidth)} w\n`;
            command += `${formatNumber(x)} ${formatNumber(yPdf)} ${formatNumber(width)} ${formatNumber(height)} re ${operation}\nQ\n`;
            append(command);
        }

        function line(x1, y1Top, x2, y2Top, color, lineWidth = 0.75) {
            append(`q\n${pdfColor(color)} RG\n${formatNumber(lineWidth)} w\n${formatNumber(x1)} ${formatNumber(page.height - y1Top)} m ${formatNumber(x2)} ${formatNumber(page.height - y2Top)} l S\nQ\n`);
        }

        function textLine(text, x, yTop, options = {}) {
            const size = options.size || 10;
            const font = options.font || 'F1';
            const color = options.color || theme.ink;
            const align = options.align || 'left';
            let drawX = x;

            if (align !== 'left') {
                const textWidth = estimateTextWidth(text, size, font);
                drawX = align === 'center' ? x - textWidth / 2 : x - textWidth;
            }

            append(`BT\n/${font} ${formatNumber(size)} Tf\n${pdfColor(color)} rg\n1 0 0 1 ${formatNumber(drawX)} ${formatNumber(page.height - yTop - size * 0.82)} Tm\n${pdfLiteral(text)} Tj\nET\n`);
        }

        function finish() {
            if (stream) {
                pages.push(stream);
            }

            const total = pages.length;
            const pagesWithFooters = pages.map((pageStream, index) => {
                return pageStream + drawPageFooter(index + 1, total, theme, page);
            });

            return createPdfFileBytes(pagesWithFooters, page);
        }

        return {
            page,
            get y() { return y; },
            set y(value) { y = value; },
            get left() { return page.marginLeft; },
            get right() { return page.width - page.marginRight; },
            get bottom() { return page.height - page.marginBottom; },
            get contentWidth() { return page.width - page.marginLeft - page.marginRight; },
            ensureSpace,
            addPage,
            rect,
            line,
            textLine,
            finish
        };
    }

    function drawPdfCover(pdf, dieta, theme) {
        const left = pdf.left;
        const width = pdf.contentWidth;
        const titleLines = wrapPdfText(dieta.nombre, width - 28, 24, 'F3');
        const descriptionLines = wrapPdfText(dieta.descripcion, width - 28, 9.4, 'F1');
        const flavorSummary = getFlavorSummary(dieta);
        const flavorsBest = flavorSummary.mejorText;
        const flavorsAvoid = flavorSummary.evitarText;
        const tasteWidth = (width - 10) / 2;
        const tasteBestLines = wrapPdfText(flavorsBest, tasteWidth - 22, 8.2, 'F1');
        const tasteAvoidLines = wrapPdfText(flavorsAvoid, tasteWidth - 22, 8.2, 'F1');
        const tasteHeight = Math.max(32, 17 + Math.max(tasteBestLines.length, tasteAvoidLines.length) * 9.2);
        const coverHeight = 53 + titleLines.length * 27 + descriptionLines.length * 11.5 + tasteHeight;
        let y = pdf.y;

        pdf.rect(left, y, width, coverHeight, theme.soft, theme.line, 0.75);
        pdf.rect(left, y, width, 6, theme.primary);
        y += 17;

        pdf.textLine('VEDAMCI', left + 15, y, { font: 'F2', size: 8.8, color: theme.dark });
        pdf.textLine('Ayurveda México 2026', left + width - 15, y, { size: 8, color: theme.muted, align: 'right' });
        y += 23;

        titleLines.forEach(line => {
            pdf.textLine(line, left + 15, y, { font: 'F3', size: 24, color: theme.dark });
            y += 27;
        });

        y += 2;
        descriptionLines.forEach(line => {
            pdf.textLine(line, left + 15, y, { size: 9.4, color: theme.muted });
            y += 11.5;
        });

        y += 10;
        drawTasteBox(pdf, left + 15, y, tasteWidth, tasteHeight, 'Mejor', tasteBestLines, theme.green, theme);
        drawTasteBox(pdf, left + 15 + tasteWidth + 10, y, tasteWidth, tasteHeight, flavorSummary.evitarLabel, tasteAvoidLines, theme.red, theme);

        pdf.y = pdf.y + coverHeight + 17;
    }

    function drawTasteBox(pdf, x, y, width, height, label, lines, color, theme) {
        pdf.rect(x, y, width, height, theme.white, theme.line, 0.65);
        pdf.rect(x, y, 4, height, color);
        pdf.textLine(label, x + 12, y + 7, { font: 'F2', size: 7.6, color });
        lines.forEach((line, index) => {
            pdf.textLine(line, x + 12, y + 18 + index * 9.2, { size: 8.2, color: theme.ink });
        });
    }

    function drawPdfCategory(pdf, catName, category, number, theme) {
        const columns = buildPdfColumns(category, theme);
        const estimatedHeight = measurePdfCategory(catName, category, columns, pdf.contentWidth);

        pdf.ensureSpace(estimatedHeight);

        let y = pdf.y;
        const left = pdf.left;
        const width = pdf.contentWidth;
        const numberText = String(number).padStart(2, '0');

        pdf.line(left, y, left + width, y, theme.primary, 1.2);
        pdf.textLine(numberText, left, y + 7, { font: 'F2', size: 8.6, color: theme.primary });
        pdf.textLine(catName, left + 31, y + 4, { font: 'F3', size: 15.4, color: theme.dark });
        y += 25;

        if (category.descripcion_general) {
            const lines = wrapPdfText(category.descripcion_general, width - 18, 8.2, 'F4');
            const descHeight = 12 + lines.length * 9.4;
            pdf.rect(left, y, width, descHeight, theme.light);
            pdf.rect(left, y, 4, descHeight, theme.primary);
            lines.forEach((line, index) => {
                pdf.textLine(line, left + 10, y + 7 + index * 9.4, { font: 'F4', size: 8.2, color: theme.muted });
            });
            y += descHeight + 11;
        }

        const gap = 12;
        const colWidth = (width - gap * 2) / 3;
        const startY = y;
        let maxY = startY;

        columns.forEach((column, index) => {
            const x = left + index * (colWidth + gap);
            const bottomY = drawPdfColumn(pdf, column, x, startY, colWidth, theme);
            maxY = Math.max(maxY, bottomY);
        });

        pdf.y = maxY + 16;
    }

    function buildPdfColumns(category, theme) {
        return [
            { title: 'Mejor / recomendados', items: category.mejor || [], color: theme.green, background: '#edf7ee' },
            { title: 'Pequeñas cantidades', items: category.moderado || [], color: theme.orange, background: '#fff4e3' },
            { title: 'Evitar', items: category.evitar || [], color: theme.red, background: '#fdebed' }
        ];
    }

    function drawPdfColumn(pdf, column, x, y, width, theme) {
        pdf.rect(x, y, width, 14, column.background, column.color, 0.55);
        pdf.textLine(column.title, x + width / 2, y + 4, { font: 'F2', size: 7.2, color: column.color, align: 'center' });
        y += 18;

        if (!column.items.length) {
            pdf.textLine('Sin indicaciones', x, y + 2, { font: 'F4', size: 7.4, color: theme.muted });
            return y + 15;
        }

        column.items.forEach(item => {
            const rowHeight = measurePdfFoodRow(item, width);
            drawPdfFoodRow(pdf, item, x, y, width, rowHeight, theme);
            y += rowHeight;
        });

        return y;
    }

    function drawPdfFoodRow(pdf, item, x, y, width, rowHeight, theme) {
        const isLocal = esAlimentoMexicano(item.alimento);
        const nameWidth = width - (isLocal ? 20 : 0);
        const nameLines = wrapPdfText(item.alimento, nameWidth, 7.8, 'F2');
        const noteLines = item.nota ? wrapPdfText(item.nota, width, 6.9, 'F1') : [];
        let lineY = y + 3.2;

        nameLines.forEach(line => {
            pdf.textLine(line, x, lineY, { font: 'F2', size: 7.8, color: theme.dark });
            lineY += 9;
        });

        if (isLocal) {
            pdf.rect(x + width - 16, y + 2.4, 16, 8.4, theme.white, theme.teal, 0.45);
            pdf.textLine('MX', x + width - 8, y + 4, { font: 'F2', size: 5.6, color: theme.teal, align: 'center' });
        }

        noteLines.forEach(line => {
            pdf.textLine(line, x, lineY, { size: 6.9, color: theme.muted });
            lineY += 8;
        });

        pdf.line(x, y + rowHeight - 1.8, x + width, y + rowHeight - 1.8, theme.line, 0.45);
    }

    function drawPdfClosingNote(pdf, theme) {
        const height = 38;
        pdf.ensureSpace(height);
        const y = pdf.y;

        pdf.line(pdf.left, y, pdf.right, y, theme.primary, 1);
        pdf.textLine('Estas dietas se basan en los principios de la medicina Ayurvédica tradicional, adaptadas con alimentos locales mexicanos.', pdf.left + pdf.contentWidth / 2, y + 10, { size: 7.8, color: theme.muted, align: 'center' });
        pdf.textLine('Contacto VEDAMCI · Cel: 3311651870 · vedamci.com.mx', pdf.left + pdf.contentWidth / 2, y + 22, { font: 'F2', size: 8, color: theme.dark, align: 'center' });
        pdf.y += height;
    }

    function measurePdfCategory(catName, category, columns, contentWidth) {
        const gap = 12;
        const colWidth = (contentWidth - gap * 2) / 3;
        const titleHeight = Math.max(25, wrapPdfText(catName, contentWidth - 31, 15.4, 'F3').length * 18 + 8);
        const descriptionHeight = category.descripcion_general
            ? 23 + wrapPdfText(category.descripcion_general, contentWidth - 18, 8.2, 'F4').length * 9.4
            : 0;
        const maxColumnHeight = Math.max(...columns.map(column => {
            const itemHeight = column.items.length
                ? column.items.reduce((total, item) => total + measurePdfFoodRow(item, colWidth), 0)
                : 15;
            return 18 + itemHeight;
        }));

        return titleHeight + descriptionHeight + maxColumnHeight + 16;
    }

    function measurePdfFoodRow(item, width) {
        const nameWidth = width - (esAlimentoMexicano(item.alimento) ? 20 : 0);
        const nameLines = wrapPdfText(item.alimento, nameWidth, 7.8, 'F2').length;
        const noteLines = item.nota ? wrapPdfText(item.nota, width, 6.9, 'F1').length : 0;
        return Math.max(16, 7 + nameLines * 9 + noteLines * 8);
    }

    function drawPageFooter(pageNumber, totalPages, theme, page) {
        const y = page.height - 31;
        const left = page.marginLeft;
        const right = page.width - page.marginRight;
        const line = `q\n${pdfColor(theme.line)} RG\n0.45 w\n${formatNumber(left)} ${formatNumber(page.height - y)} m ${formatNumber(right)} ${formatNumber(page.height - y)} l S\nQ\n`;
        const brand = pdfTextCommand('VEDAMCI · vedamci.com.mx', left, y + 8, { size: 7, color: theme.muted, font: 'F1' }, page);
        const pageText = pdfTextCommand(`Página ${pageNumber} / ${totalPages}`, right, y + 8, { size: 7, color: theme.muted, font: 'F1', align: 'right' }, page);

        return line + brand + pageText;
    }

    function createPdfFileBytes(pageStreams, page) {
        const chunks = [];
        const offsets = [0];
        let offset = 0;

        function addBytes(bytes) {
            chunks.push(bytes);
            offset += bytes.length;
        }

        function addAscii(value) {
            addBytes(binaryStringToBytes(value));
        }

        function addObject(id, body) {
            offsets[id] = offset;
            addAscii(`${id} 0 obj\n${body}\nendobj\n`);
        }

        addAscii('%PDF-1.4\n%\xB5\xED\xAE\xFB\n');

        const pageObjects = pageStreams.map((_, index) => 7 + index * 2);
        const contentObjects = pageStreams.map((_, index) => 8 + index * 2);

        addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
        addObject(2, `<< /Type /Pages /Kids [${pageObjects.map(id => `${id} 0 R`).join(' ')}] /Count ${pageStreams.length} >>`);
        addObject(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
        addObject(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
        addObject(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
        addObject(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>');

        pageStreams.forEach((streamContent, index) => {
            const pageObject = pageObjects[index];
            const contentObject = contentObjects[index];
            const streamBytes = binaryStringToBytes(streamContent);

            addObject(pageObject, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatNumber(page.width)} ${formatNumber(page.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${contentObject} 0 R >>`);

            offsets[contentObject] = offset;
            addAscii(`${contentObject} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
            addBytes(streamBytes);
            addAscii('\nendstream\nendobj\n');
        });

        const xrefOffset = offset;
        const totalObjects = 6 + pageStreams.length * 2;
        addAscii(`xref\n0 ${totalObjects + 1}\n`);
        addAscii('0000000000 65535 f \n');
        for (let id = 1; id <= totalObjects; id += 1) {
            addAscii(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
        }
        addAscii(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

        return concatByteArrays(chunks);
    }

    function wrapPdfText(text, maxWidth, fontSize, font = 'F1') {
        const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
        const lines = [];
        let current = '';

        words.forEach(word => {
            const test = current ? `${current} ${word}` : word;
            if (estimateTextWidth(test, fontSize, font) <= maxWidth) {
                current = test;
                return;
            }

            if (current) {
                lines.push(current);
                current = '';
            }

            if (estimateTextWidth(word, fontSize, font) <= maxWidth) {
                current = word;
            } else {
                splitLongPdfWord(word, maxWidth, fontSize, font).forEach(part => {
                    if (estimateTextWidth(part, fontSize, font) > maxWidth) {
                        lines.push(part);
                    } else if (!current) {
                        current = part;
                    } else {
                        lines.push(current);
                        current = part;
                    }
                });
            }
        });

        if (current) lines.push(current);
        return lines.length ? lines : [''];
    }

    function splitLongPdfWord(word, maxWidth, fontSize, font) {
        const parts = [];
        let current = '';
        Array.from(word).forEach(char => {
            const test = `${current}${char}`;
            if (current && estimateTextWidth(test, fontSize, font) > maxWidth) {
                parts.push(current);
                current = char;
            } else {
                current = test;
            }
        });
        if (current) parts.push(current);
        return parts;
    }

    function estimateTextWidth(text, fontSize, font = 'F1') {
        const weight = font === 'F2' || font === 'F3' ? 1.05 : 1;
        return Array.from(String(text || '')).reduce((total, char) => total + estimateCharWidth(char), 0) * fontSize * weight;
    }

    function estimateCharWidth(char) {
        if (char === ' ') return 0.28;
        if ('ilI.,:;!|\'`'.includes(char)) return 0.24;
        if ('jrtf()[]{}"'.includes(char)) return 0.34;
        if ('mwMW@%&'.includes(char)) return 0.78;
        if ('ABCDEFGHKNOPQRSTUVWXYZÁÉÍÓÚÑ'.includes(char)) return 0.62;
        if ('0123456789'.includes(char)) return 0.52;
        if ('-/\\'.includes(char)) return 0.34;
        return 0.49;
    }

    function pdfTextCommand(text, x, yTop, options, page) {
        const size = options.size || 10;
        const font = options.font || 'F1';
        const color = options.color || '#000000';
        let drawX = x;

        if (options.align && options.align !== 'left') {
            const textWidth = estimateTextWidth(text, size, font);
            drawX = options.align === 'center' ? x - textWidth / 2 : x - textWidth;
        }

        return `BT\n/${font} ${formatNumber(size)} Tf\n${pdfColor(color)} rg\n1 0 0 1 ${formatNumber(drawX)} ${formatNumber(page.height - yTop - size * 0.82)} Tm\n${pdfLiteral(text)} Tj\nET\n`;
    }

    function pdfLiteral(value) {
        let output = '(';
        Array.from(String(value ?? '')).forEach(char => {
            const code = winAnsiCode(char);
            if (code === 40 || code === 41 || code === 92) {
                output += `\\${String.fromCharCode(code)}`;
            } else if (code < 32) {
                output += ' ';
            } else {
                output += String.fromCharCode(code);
            }
        });
        return `${output})`;
    }

    function winAnsiCode(char) {
        const replacements = {
            '–': 150,
            '—': 151,
            '‘': 145,
            '’': 146,
            '“': 147,
            '”': 148,
            '…': 133,
            '•': 149,
            '™': 153,
            '€': 128
        };
        const code = char.charCodeAt(0);

        if (replacements[char]) return replacements[char];
        if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) return code;
        return 63;
    }

    function pdfColor(hex) {
        const value = hex.replace('#', '');
        const r = parseInt(value.slice(0, 2), 16) / 255;
        const g = parseInt(value.slice(2, 4), 16) / 255;
        const b = parseInt(value.slice(4, 6), 16) / 255;
        return `${formatNumber(r)} ${formatNumber(g)} ${formatNumber(b)}`;
    }

    function formatNumber(value) {
        return Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    }

    function binaryStringToBytes(value) {
        const bytes = new Uint8Array(value.length);
        for (let index = 0; index < value.length; index += 1) {
            bytes[index] = value.charCodeAt(index) & 0xff;
        }
        return bytes;
    }

    function concatByteArrays(arrays) {
        const totalLength = arrays.reduce((total, array) => total + array.length, 0);
        const output = new Uint8Array(totalLength);
        let offset = 0;
        arrays.forEach(array => {
            output.set(array, offset);
            offset += array.length;
        });
        return output;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.__VEDAMCI_PDF_TEST__ = { createDietaPdfBytes };
    }

    loadData();
});
