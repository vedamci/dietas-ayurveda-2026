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

        // Evento de impresión
        printBtn.addEventListener('click', () => {
            window.print();
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

    loadData();
});
