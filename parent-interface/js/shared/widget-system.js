/**
 * Claudyne Parent Interface - Widget System
 * Système de widgets drag & drop avec grille responsive
 */

export class WidgetSystem {
    constructor(options = {}) {
        this.options = {
            container: 'dashboard-grid',
            gridColumns: 12,
            gridRows: 'auto',
            enableDragDrop: true,
            enableResize: true,
            enableCustomization: true,
            ...options
        };

        this.widgets = new Map();
        this.gridContainer = null;
        this.isDragging = false;
        this.dragData = null;
    }

    async initialize(widgetConfigs) {
        this.gridContainer = document.getElementById(this.options.container);

        if (!this.gridContainer) {
            throw new Error(`Widget container "${this.options.container}" not found`);
        }

        // Setup grid CSS
        this.setupGrid();

        // Setup drag & drop events
        if (this.options.enableDragDrop) {
            this.setupDragDrop();
        }

        // Load widget configurations
        this.loadWidgetConfigs(widgetConfigs);

        console.log('[WidgetSystem] Initialized with', widgetConfigs.length, 'widgets');
    }

    setupGrid() {
        this.gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.options.gridColumns}, 1fr);
            grid-auto-rows: minmax(100px, auto);
            gap: 1.5rem;
            min-height: 400px;
            position: relative;
        `;

        // Responsive adjustments
        if (window.innerWidth < 768) {
            this.gridContainer.style.gridTemplateColumns = '1fr';
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                this.gridContainer.style.gridTemplateColumns = '1fr';
            } else {
                this.gridContainer.style.gridTemplateColumns = `repeat(${this.options.gridColumns}, 1fr)`;
            }
        });
    }

    loadWidgetConfigs(configs) {
        configs.forEach(config => {
            this.widgets.set(config.id, {
                ...config,
                element: null,
                isVisible: true
            });
        });
    }

    async createWidget(config) {
        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.id = `widget-${config.id}`;
        widget.dataset.widgetId = config.id;
        widget.dataset.widgetType = config.type;

        // Position dans la grille
        widget.style.gridColumn = `span ${Math.min(config.position.w, this.options.gridColumns)}`;
        widget.style.gridRow = `span ${config.position.h}`;

        // Structure du widget
        widget.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">
                    <i class="widget-icon fas fa-${this.getWidgetIcon(config.type)}"></i>
                    <h3>${config.title}</h3>
                </div>
                <div class="widget-controls">
                    ${this.options.enableDragDrop ? '<button class="widget-drag-handle" title="Déplacer"><i class="fas fa-grip-vertical"></i></button>' : ''}
                    <button class="widget-menu" onclick="widgetSystem.toggleWidgetMenu('${config.id}')" title="Options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
                <div class="widget-menu-dropdown" id="menu-${config.id}">
                    <button onclick="widgetSystem.refreshWidget('${config.id}')">
                        <i class="fas fa-sync-alt"></i> Actualiser
                    </button>
                    <button onclick="widgetSystem.configureWidget('${config.id}')">
                        <i class="fas fa-cog"></i> Configurer
                    </button>
                    <button onclick="widgetSystem.removeWidget('${config.id}')" class="danger">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
            <div class="widget-content" id="content-${config.id}">
                <div class="widget-loading">
                    <div class="spinner"></div>
                    <span>Chargement...</span>
                </div>
            </div>
        `;

        // Ajout au container
        this.gridContainer.appendChild(widget);

        // Sauvegarde de l'élément
        const widgetData = this.widgets.get(config.id);
        widgetData.element = widget;

        // Setup interactions
        if (this.options.enableDragDrop) {
            this.makeDraggable(config.id);
        }

        if (this.options.enableResize) {
            this.makeResizable(config.id);
        }

        return widget;
    }

    setWidgetContent(widgetId, content) {
        const contentContainer = document.getElementById(`content-${widgetId}`);
        if (contentContainer) {
            contentContainer.innerHTML = content;

            // Trigger content loaded event
            const widget = this.widgets.get(widgetId);
            if (widget && widget.element) {
                widget.element.dispatchEvent(new CustomEvent('widget:contentLoaded', {
                    detail: { widgetId, content }
                }));
            }
        }
    }

    makeDraggable(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget || !widget.element) return;

        const dragHandle = widget.element.querySelector('.widget-drag-handle');
        if (!dragHandle) return;

        dragHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startDrag(widgetId, e);
        });

        dragHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(widgetId, e.touches[0]);
        }, { passive: false });
    }

    makeResizable(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget || !widget.element) return;

        // Add resize handles
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'widget-resize-handle';
        resizeHandle.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
        widget.element.appendChild(resizeHandle);

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startResize(widgetId, e);
        });
    }

    startDrag(widgetId, pointer) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        this.isDragging = true;
        this.dragData = {
            widgetId,
            startX: pointer.clientX,
            startY: pointer.clientY,
            widget: widget.element
        };

        // Visual feedback
        widget.element.classList.add('dragging');
        this.createDragPreview();

        // Event listeners
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
        document.addEventListener('touchmove', this.onDragMove.bind(this));
        document.addEventListener('touchend', this.onDragEnd.bind(this));
    }

    onDragMove(e) {
        if (!this.isDragging || !this.dragData) return;

        const pointer = e.touches ? e.touches[0] : e;
        const deltaX = pointer.clientX - this.dragData.startX;
        const deltaY = pointer.clientY - this.dragData.startY;

        // Update preview position
        if (this.dragPreview) {
            this.dragPreview.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }

        // Highlight drop zones
        this.highlightDropZone(pointer);
    }

    onDragEnd(e) {
        if (!this.isDragging) return;

        const pointer = e.changedTouches ? e.changedTouches[0] : e;

        // Find drop target
        const dropTarget = this.findDropTarget(pointer);

        if (dropTarget) {
            this.executeMove(this.dragData.widgetId, dropTarget);
        }

        // Cleanup
        this.cleanupDrag();
    }

    createDragPreview() {
        if (!this.dragData) return;

        this.dragPreview = this.dragData.widget.cloneNode(true);
        this.dragPreview.className = 'widget drag-preview';
        this.dragPreview.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            opacity: 0.8;
            transform: scale(0.9);
        `;

        document.body.appendChild(this.dragPreview);
    }

    highlightDropZone(pointer) {
        // Remove existing highlights
        document.querySelectorAll('.drop-zone').forEach(el => {
            el.classList.remove('drop-zone');
        });

        // Find and highlight current drop zone
        const element = document.elementFromPoint(pointer.clientX, pointer.clientY);
        const dropZone = element?.closest('.widget') || this.gridContainer;

        if (dropZone) {
            dropZone.classList.add('drop-zone');
        }
    }

    findDropTarget(pointer) {
        const element = document.elementFromPoint(pointer.clientX, pointer.clientY);
        return element?.closest('.widget') || this.gridContainer;
    }

    executeMove(widgetId, dropTarget) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        if (dropTarget === this.gridContainer) {
            // Move to end
            this.gridContainer.appendChild(widget.element);
        } else if (dropTarget.classList.contains('widget')) {
            // Insert before target
            this.gridContainer.insertBefore(widget.element, dropTarget);
        }

        // Save new layout
        this.saveLayout();

        console.log('[WidgetSystem] Widget moved:', widgetId);
    }

    cleanupDrag() {
        if (this.dragData && this.dragData.widget) {
            this.dragData.widget.classList.remove('dragging');
        }

        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }

        document.querySelectorAll('.drop-zone').forEach(el => {
            el.classList.remove('drop-zone');
        });

        // Remove event listeners
        document.removeEventListener('mousemove', this.onDragMove);
        document.removeEventListener('mouseup', this.onDragEnd);
        document.removeEventListener('touchmove', this.onDragMove);
        document.removeEventListener('touchend', this.onDragEnd);

        this.isDragging = false;
        this.dragData = null;
    }

    setupDragDrop() {
        // Setup global drag events
        this.gridContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.gridContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            // Handle external widget drops
        });
    }

    getWidgetIcon(type) {
        const icons = {
            metrics: 'chart-bar',
            chart: 'chart-line',
            'activity-list': 'clock',
            'children-grid': 'user-graduate',
            achievements: 'trophy',
            calendar: 'calendar-alt',
            goals: 'target',
            weather: 'cloud-sun',
            messages: 'comments',
            progress: 'tasks'
        };

        return icons[type] || 'widget';
    }

    // Widget management methods
    async refreshWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        const contentContainer = document.getElementById(`content-${widgetId}`);
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="widget-loading">
                    <div class="spinner"></div>
                    <span>Actualisation...</span>
                </div>
            `;

            // Trigger refresh event
            widget.element.dispatchEvent(new CustomEvent('widget:refresh', {
                detail: { widgetId }
            }));
        }

        console.log('[WidgetSystem] Widget refreshed:', widgetId);
    }

    configureWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        // Open configuration modal
        console.log('[WidgetSystem] Configure widget:', widgetId);

        // Trigger configure event
        widget.element.dispatchEvent(new CustomEvent('widget:configure', {
            detail: { widgetId, config: widget.config }
        }));
    }

    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer ce widget ?')) {
            // Remove from DOM
            if (widget.element) {
                widget.element.remove();
            }

            // Remove from widgets map
            this.widgets.delete(widgetId);

            // Save layout
            this.saveLayout();

            console.log('[WidgetSystem] Widget removed:', widgetId);
        }
    }

    toggleWidgetMenu(widgetId) {
        const menu = document.getElementById(`menu-${widgetId}`);
        if (menu) {
            menu.classList.toggle('open');

            // Close other menus
            document.querySelectorAll('.widget-menu-dropdown.open').forEach(other => {
                if (other !== menu) {
                    other.classList.remove('open');
                }
            });
        }
    }

    // Layout management
    async saveLayout() {
        const layout = this.getCurrentLayout();

        try {
            // Save to IndexedDB if available
            if (window.parentDB) {
                await window.parentDB.setPreference('dashboardLayout', layout);
            } else {
                // Fallback to localStorage
                localStorage.setItem('parentDashboardLayout', JSON.stringify(layout));
            }

            console.log('[WidgetSystem] Layout saved');
        } catch (error) {
            console.error('[WidgetSystem] Failed to save layout:', error);
        }
    }

    getCurrentLayout() {
        const layout = [];

        this.widgets.forEach((widget, id) => {
            if (widget.element) {
                const rect = widget.element.getBoundingClientRect();
                const gridRect = this.gridContainer.getBoundingClientRect();

                layout.push({
                    id,
                    type: widget.type,
                    title: widget.title,
                    position: {
                        x: Math.round((rect.left - gridRect.left) / (gridRect.width / this.options.gridColumns)),
                        y: Math.round((rect.top - gridRect.top) / 100), // Approximation
                        w: parseInt(widget.element.style.gridColumn?.replace('span ', '') || 1),
                        h: parseInt(widget.element.style.gridRow?.replace('span ', '') || 1)
                    },
                    config: widget.config,
                    visible: widget.isVisible
                });
            }
        });

        return layout;
    }

    async loadUserLayout() {
        try {
            let layout = null;

            // Try IndexedDB first
            if (window.parentDB) {
                layout = await window.parentDB.getPreference('dashboardLayout');
            }

            // Fallback to localStorage
            if (!layout) {
                const stored = localStorage.getItem('parentDashboardLayout');
                layout = stored ? JSON.parse(stored) : null;
            }

            return layout;
        } catch (error) {
            console.error('[WidgetSystem] Failed to load user layout:', error);
            return null;
        }
    }

    // Public API
    getWidgetConfigs() {
        const configs = {};
        this.widgets.forEach((widget, id) => {
            configs[id] = {
                type: widget.type,
                title: widget.title,
                position: widget.position,
                config: widget.config,
                visible: widget.isVisible
            };
        });
        return configs;
    }

    async refreshAllWidgets() {
        for (const [widgetId] of this.widgets) {
            await this.refreshWidget(widgetId);
        }
    }

    addWidget(config) {
        this.widgets.set(config.id, config);
        return this.createWidget(config);
    }

    hideWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget && widget.element) {
            widget.element.style.display = 'none';
            widget.isVisible = false;
            this.saveLayout();
        }
    }

    showWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget && widget.element) {
            widget.element.style.display = '';
            widget.isVisible = true;
            this.saveLayout();
        }
    }
}

// Export global pour les interactions HTML
if (typeof window !== 'undefined') {
    window.widgetSystem = null; // Sera initialisé par le dashboard
}