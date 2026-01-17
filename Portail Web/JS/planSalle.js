document.addEventListener("DOMContentLoaded", function() {
    // Éléments DOM
    const layout = document.getElementById("planSalle-restaurant-layout");
    if (!layout) {
        console.error("L'élément 'planSalle-restaurant-layout' est introuvable");
        return;
    }

    // Éléments principaux
    const elements = {
        // Création de tables
        addTableBtn: document.getElementById("planSalle-add-table-btn"),
        tableModal: document.getElementById("planSalle-table-config-modal"),
        confirmTableBtn: document.getElementById("planSalle-confirm-table-btn"),
        tableNumberInput: document.getElementById("planSalle-table-number-input"),
        seatsInput: document.getElementById("planSalle-table-seats-input"),
        shapeSelect: document.getElementById("planSalle-table-shape-select"),
        closeTableModalBtn: document.querySelector(".planSalle-close-modal"),
        
        // Gestion des layouts
        saveLayoutBtn: document.getElementById("planSalle-save-layout"),
        saveLayoutModal: document.getElementById("modal-save-layout"),
        layoutNameInput: document.getElementById("planSalle-layout-name-input"),
        confirmSaveBtn: document.getElementById("planSalle-confirm-save"),
        closeSaveModalBtn: document.querySelector(".close-save-layout-modal"),
        loadLayoutBtn: document.getElementById("planSalle-load-layout"),
        deleteLayoutBtn: document.getElementById("planSalle-delete-layout"),
        resetLayoutBtn: document.getElementById("planSalle-reset-layout"),
        layoutList: document.getElementById("planSalle-layout-list"),
        layoutDateDisplay: document.getElementById("planSalle-layout-date")
    };

    // Données
    let tables = [];
    let nextTableNumber = 1;
    let currentLayoutName = "";

    // Initialisation
    initDragDropArea();
    setupEventListeners();
    refreshLayoutList();

    function initDragDropArea() {
        if (typeof interact === 'undefined') {
            console.warn("Interact.js non chargé - le drag & drop ne fonctionnera pas");
            return;
        }
        
        // Zone de dépôt
        interact(layout).dropzone({
            accept: '.table',
            overlap: 0.75,
            ondrop: function(event) {
                const table = event.relatedTarget;
                table.classList.remove('dragging');
                saveTablePosition(table);
            }
        });
    }

    function setupEventListeners() {
        // Tables
        elements.addTableBtn?.addEventListener("click", () => openModal(elements.tableModal));
        elements.closeTableModalBtn?.addEventListener("click", () => closeModal(elements.tableModal));
        elements.confirmTableBtn?.addEventListener("click", handleConfirmTable);
        
        // Layouts
        elements.saveLayoutBtn?.addEventListener("click", () => openModal(elements.saveLayoutModal));
        elements.closeSaveModalBtn?.addEventListener("click", () => closeModal(elements.saveLayoutModal));
        elements.confirmSaveBtn?.addEventListener("click", saveCurrentLayout);
        elements.loadLayoutBtn?.addEventListener("click", loadSelectedLayout);
        elements.deleteLayoutBtn?.addEventListener("click", deleteSelectedLayout);
        elements.resetLayoutBtn?.addEventListener("click", confirmResetLayout);
        
        // Sélection de layout
        elements.layoutList?.addEventListener("change", updateLayoutInfo);
        
        // Fermeture modale avec Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                document.querySelectorAll(".planSalle-modal").forEach(modal => {
                    if (modal.style.display === "flex") closeModal(modal);
                });
            }
        });
    }

    // ==================== FONCTIONS MODALES ====================
    function openModal(modal) {
        if (!modal) return;
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        
        if (modal === elements.tableModal) {
            resetModalInputs();
            elements.tableNumberInput?.focus();
        } else if (modal === elements.saveLayoutModal) {
            elements.layoutNameInput.value = currentLayoutName || generateDefaultLayoutName();
            elements.layoutNameInput?.focus();
        }
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.style.display = "none";
        document.body.style.overflow = "";
    }

    function generateDefaultLayoutName() {
        const now = new Date();
        return `Layout ${now.toLocaleDateString()} ${now.getHours()}h${now.getMinutes().toString().padStart(2, '0')}`;
    }

    // ==================== GESTION DES TABLES ====================
    function handleConfirmTable() {
        const tableData = getTableDataFromForm();
        if (!tableData) return;

        if (validateTableNumber(tableData.number)) {
            createTable(tableData);
            closeModal(elements.tableModal);
            updateNextTableNumber(tableData.number);
        }
    }

    function createTable(data) {
        const table = document.createElement("div");
        table.className = `table ${data.shape}`;
        table.dataset.id = `table-${Date.now()}`;
        table.dataset.seats = data.seats;
        
        table.innerHTML = `
            <div class="table-content">
                <div class="table-number">${data.number}</div>
                <div class="table-seats">${data.seats} place${data.seats > 1 ? 's' : ''}</div>
                <button class="delete-btn"><i class="fas fa-times"></i></button>
            </div>
        `;

        // Position et style
        Object.assign(table.style, {
            position: "absolute",
            cursor: "move",
            left: `${data.x}px`,
            top: `${data.y}px`,
            zIndex: "10"
        });
        
        setupTableStyle(table, data);
        setupTableInteractions(table, data);
        
        layout.appendChild(table);
        tables.push({
            ...data,
            element: table,
            id: table.dataset.id
        });
    }

    function setupTableStyle(table, data) {
        const baseSize = Math.max(80, Math.min(data.seats * 15, 200));
        let width = baseSize;
        let height = baseSize;

        if (data.shape === 'rectangle') {
            width = baseSize * 1.5;
            height = baseSize * 0.8;
        } else if (data.shape === 'oval') {
            width = baseSize * 1.3;
            height = baseSize * 0.7;
        }

        Object.assign(table.style, {
            width: `${width}px`,
            height: `${height}px`,
            transform: 'none'
        });
    }

    function setupTableInteractions(table, data) {
        if (typeof interact !== 'undefined') {
            interact(table).draggable({
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: layout,
                        endOnly: true
                    })
                ],
                listeners: {
                    start: (event) => {
                        event.target.classList.add('dragging');
                        event.target.style.zIndex = "1000";
                    },
                    move: (event) => {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end: (event) => {
                        const target = event.target;
                        target.classList.remove('dragging');
                        target.style.zIndex = "10";
                        saveTablePosition(target);
                    }
                }
            });
        }

        // Bouton de suppression
        table.querySelector('.delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Supprimer la table "${data.number}" ?`)) {
                table.style.transition = "all 0.3s ease";
                table.style.opacity = "0";
                setTimeout(() => {
                    table.remove();
                    tables = tables.filter(t => t.element !== table);
                }, 300);
            }
        });
    }

    function saveTablePosition(table) {
        const tableData = tables.find(t => t.element === table);
        if (!tableData) return;

        const x = (parseFloat(table.getAttribute('data-x')) || 0) + parseInt(table.style.left || "0", 10);
        const y = (parseFloat(table.getAttribute('data-y')) || 0) + parseInt(table.style.top || "0", 10);
        
        tableData.x = x;
        tableData.y = y;
        
        Object.assign(table.style, {
            left: `${x}px`,
            top: `${y}px`,
            transform: 'none'
        });
        
        table.removeAttribute('data-x');
        table.removeAttribute('data-y');
    }

    // ==================== GESTION DES LAYOUTS ====================
    function saveCurrentLayout() {
        const layoutName = elements.layoutNameInput.value.trim();
        
        if (!validateLayoutName(layoutName)) return;

        const layoutData = {
            name: layoutName,
            date: new Date().toISOString(),
            tables: tables.map(t => ({
                number: t.number,
                seats: t.seats,
                shape: t.shape,
                x: t.x,
                y: t.y
            })),
            nextTableNumber: nextTableNumber
        };

        // Sauvegarde dans localStorage
        const savedLayouts = JSON.parse(localStorage.getItem('restaurantLayouts') || '{}');
        savedLayouts[layoutName] = layoutData;
        localStorage.setItem('restaurantLayouts', JSON.stringify(savedLayouts));

        currentLayoutName = layoutName;
        closeModal(elements.saveLayoutModal);
        refreshLayoutList();
        showNotification(`Layout "${layoutName}" sauvegardé !`);
    }

    function validateLayoutName(name) {
        if (!name) {
            showError("Veuillez entrer un nom pour ce layout");
            return false;
        }

        if (!/^[\w\s-]+$/.test(name)) {
            showError("Le nom ne peut contenir que des lettres, chiffres, espaces, tirets et underscores");
            return false;
        }

        if (name.length > 50) {
            showError("Le nom ne peut dépasser 50 caractères");
            return false;
        }

        const savedLayouts = JSON.parse(localStorage.getItem('restaurantLayouts') || '{}');
        if (savedLayouts[name] && name !== currentLayoutName) {
            if (!confirm(`Un layout nommé "${name}" existe déjà. Remplacer ?`)) {
                return false;
            }
        }

        return true;
    }

    function loadSelectedLayout() {
        const layoutName = elements.layoutList.value;
        if (!layoutName) return;

        const savedLayouts = JSON.parse(localStorage.getItem('restaurantLayouts') || '{}');
        const layoutData = savedLayouts[layoutName];

        if (layoutData) {
            resetLayout(false);
            
            layoutData.tables.forEach(t => {
                createTable({
                    number: t.number,
                    seats: t.seats,
                    shape: t.shape,
                    x: t.x,
                    y: t.y
                });
            });

            nextTableNumber = layoutData.nextTableNumber || getNextAvailableTableNumber();
            currentLayoutName = layoutName;
            updateLayoutInfo();
            showNotification(`Layout "${layoutName}" chargé !`);
        }
    }

    function deleteSelectedLayout() {
        const layoutName = elements.layoutList.value;
        if (!layoutName || !confirm(`Supprimer définitivement le layout "${layoutName}" ?`)) return;

        const savedLayouts = JSON.parse(localStorage.getItem('restaurantLayouts') || '{}');
        delete savedLayouts[layoutName];
        localStorage.setItem('restaurantLayouts', JSON.stringify(savedLayouts));

        if (currentLayoutName === layoutName) {
            resetLayout(false);
            currentLayoutName = "";
        }

        refreshLayoutList();
        showNotification(`Layout "${layoutName}" supprimé !`);
    }

    function refreshLayoutList() {
        const savedLayouts = JSON.parse(localStorage.getItem('restaurantLayouts') || '{}');
        elements.layoutList.innerHTML = '<option value="">-- Sélectionner --</option>';
        
        Object.keys(savedLayouts).sort().forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            if (name === currentLayoutName) option.selected = true;
            elements.layoutList.appendChild(option);
        });
        
        updateLayoutInfo();
    }

    function updateLayoutInfo() {
        const layoutName = elements.layoutList.value;
        if (!layoutName) {
            elements.layoutDateDisplay.textContent = "";
            return;
        }

        const savedLayouts = JSON.parse(localStorage.getItem('restaurantLayouts') || '{}');
        const layoutData = savedLayouts[layoutName];
        
        if (layoutData) {
            const date = new Date(layoutData.date);
            elements.layoutDateDisplay.textContent = `Sauvegardé le: ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
        }
    }

    // ==================== FONCTIONS UTILITAIRES ====================
    function resetLayout(confirmNeeded = true) {
        if (confirmNeeded && !confirm("Réinitialiser le layout actuel ?")) return;
        
        tables.forEach(t => t.element.remove());
        tables = [];
        nextTableNumber = 1;
        currentLayoutName = "";
        elements.layoutDateDisplay.textContent = "";
    }

    function confirmResetLayout() {
        if (confirm("Voulez-vous vraiment réinitialiser le layout actuel ?")) {
            resetLayout();
            refreshLayoutList();
        }
    }

    function getTableDataFromForm() {
        try {
            const tableNumber = elements.tableNumberInput.value.trim() || `Table ${nextTableNumber}`;
            const seats = Math.max(1, Math.min(parseInt(elements.seatsInput.value) || 4, 20));
            const shape = elements.shapeSelect.value || "round";

            return {
                number: tableNumber,
                seats: seats,
                shape: shape,
                x: Math.floor(Math.random() * (layout.offsetWidth - 200)) + 50,
                y: Math.floor(Math.random() * (layout.offsetHeight - 200)) + 50
            };
        } catch (error) {
            console.error("Erreur dans getTableDataFromForm:", error);
            return null;
        }
    }

    function resetModalInputs() {
        elements.tableNumberInput.value = `Table ${nextTableNumber}`;
        elements.seatsInput.value = "4";
        elements.shapeSelect.value = "round";
    }

    function validateTableNumber(number) {
        if (!number || !number.trim()) {
            alert("Veuillez entrer un numéro de table.");
            elements.tableNumberInput.focus();
            return false;
        }
        
        const isDuplicate = tables.some(table => 
            table.number.toLowerCase() === number.toLowerCase()
        );
        
        if (isDuplicate) {
            alert(`La table "${number}" existe déjà. Veuillez en choisir un autre.`);
            elements.tableNumberInput.focus();
            return false;
        }
        
        return true;
    }

    function updateNextTableNumber(currentNumber) {
        const num = extractNumber(currentNumber);
        if (num !== null) {
            nextTableNumber = Math.max(nextTableNumber, num + 1);
        }
    }

    function getNextAvailableTableNumber() {
        const numbers = tables.map(t => extractNumber(t.number)).filter(n => !isNaN(n));
        return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    }

    function extractNumber(input) {
        if (!input) return null;
        const match = input.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
    }

    function showNotification(message) {
        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add("fade-out");
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    function showError(message) {
        const existingError = elements.saveLayoutModal.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = 'red';
        errorElement.style.marginTop = '10px';
        errorElement.textContent = message;
        
        elements.confirmSaveBtn.insertAdjacentElement('afterend', errorElement);
        
        setTimeout(() => errorElement.remove(), 5000);
    }
});