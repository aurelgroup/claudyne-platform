/**
 * Claudyne Parent Interface - Planning Module
 * Planification familiale intelligente avec IA et synchronisation
 */

export class PlanningModule {
    constructor(options = {}) {
        this.options = {
            websocketUrl: 'wss://api.claudyne.com/parent/planning',
            calendarSync: true,
            aiOptimization: true,
            notificationThreshold: 30, // minutes
            ...options
        };

        this.calendar = null;
        this.events = new Map();
        this.goals = new Map();
        this.reminders = [];
        this.websocket = null;
        this.isConnected = false;
        this.currentWeek = new Date();
    }

    async initialize() {
        console.log('[Planning] Initializing planning module...');

        await this.setupWebSocket();
        await this.loadPlanningData();
        this.setupCalendar();
        this.startRealTimeUpdates();
        this.setupNotifications();

        console.log('[Planning] Planning module ready');
    }

    async setupWebSocket() {
        try {
            this.websocket = new WebSocket(this.options.websocketUrl);

            this.websocket.onopen = () => {
                console.log('[Planning] WebSocket connected');
                this.isConnected = true;
                this.subscribeToUpdates();
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };

            this.websocket.onclose = () => {
                console.log('[Planning] WebSocket disconnected');
                this.isConnected = false;
                setTimeout(() => this.setupWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('[Planning] WebSocket error:', error);
                this.isConnected = false;
            };

        } catch (error) {
            console.error('[Planning] Failed to setup WebSocket:', error);
        }
    }

    subscribeToUpdates() {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

        const subscription = {
            type: 'subscribe',
            channels: ['events', 'goals', 'reminders', 'ai_optimization'],
            userId: this.getUserId()
        };

        this.websocket.send(JSON.stringify(subscription));
    }

    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'event_added':
                this.addEvent(data.payload);
                break;
            case 'event_updated':
                this.updateEvent(data.payload);
                break;
            case 'event_deleted':
                this.deleteEvent(data.payload.id);
                break;
            case 'goal_progress_update':
                this.updateGoalProgress(data.payload);
                break;
            case 'new_reminder':
                this.addReminder(data.payload);
                break;
            case 'schedule_optimization':
                this.handleAIOptimization(data.payload);
                break;
        }
    }

    async render() {
        return `
            <div class="planning-container">
                <div class="planning-header">
                    <h2 class="planning-title">Planification Familiale</h2>
                    <p class="planning-description">Organisez et synchronisez les activités d'apprentissage de toute la famille</p>
                </div>

                <div class="planning-layout">
                    <div class="planning-main">
                        ${this.renderCalendarCard()}
                    </div>
                    <div class="planning-sidebar">
                        ${this.renderGoalsCard()}
                        ${this.renderRemindersCard()}
                    </div>
                </div>
            </div>
        `;
    }

    renderCalendarCard() {
        return `
            <div class="planning-card calendar-card animate-fade-in">
                <div class="card-header">
                    <i class="fas fa-calendar planning-icon-calendar"></i>
                    <h3>Calendrier de la semaine</h3>
                    <div class="calendar-controls">
                        <button class="btn btn-secondary btn-small" onclick="planningModule.previousWeek()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="current-week">${this.getWeekLabel()}</span>
                        <button class="btn btn-secondary btn-small" onclick="planningModule.nextWeek()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-primary btn-small" onclick="planningModule.addEvent()">
                            <i class="fas fa-plus"></i>
                            Ajouter
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="calendar-grid">
                        ${this.renderCalendarHeader()}
                        ${this.renderCalendarWeek()}
                    </div>
                </div>
            </div>
        `;
    }

    renderCalendarHeader() {
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        return days.map(day => `
            <div class="calendar-day-header">${day}</div>
        `).join('');
    }

    renderCalendarWeek() {
        const weekStart = this.getWeekStart(this.currentWeek);
        const weekDays = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            weekDays.push(this.renderCalendarDay(day));
        }

        return weekDays.join('');
    }

    renderCalendarDay(date) {
        const dayEvents = this.getEventsForDate(date);
        const isToday = this.isToday(date);

        return `
            <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${date.toISOString()}">
                <div class="day-number">${date.getDate()}</div>
                <div class="day-events">
                    ${dayEvents.map(event => this.renderCalendarEvent(event)).join('')}
                </div>
                <button class="add-event-btn" onclick="planningModule.addEventForDate('${date.toISOString()}')"
                        title="Ajouter un événement">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }

    renderCalendarEvent(event) {
        return `
            <div class="calendar-event ${event.type}"
                 onclick="planningModule.editEvent('${event.id}')"
                 title="${event.title} - ${event.time}">
                <div class="event-time">${event.time}</div>
                <div class="event-title">${event.title}</div>
                <div class="event-child">${event.child || ''}</div>
            </div>
        `;
    }

    renderGoalsCard() {
        const goals = Array.from(this.goals.values());

        return `
            <div class="planning-card goals-card animate-fade-in">
                <div class="card-header">
                    <i class="fas fa-tasks planning-icon-goals"></i>
                    <h3>Objectifs hebdomadaires</h3>
                    <button class="btn btn-secondary btn-small" onclick="planningModule.addGoal()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="goals-list">
                        ${goals.map(goal => this.renderGoal(goal)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderGoal(goal) {
        const progressColor = this.getProgressColor(goal.progress);

        return `
            <div class="goal-item" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <span class="goal-title">${goal.title}</span>
                    <span class="goal-progress" style="color: ${progressColor}">${goal.progress}%</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="progress-bar" style="width: ${goal.progress}%; background: ${progressColor};"></div>
                </div>
                <div class="goal-meta">
                    <span class="goal-child">${goal.child}</span>
                    <span class="goal-deadline">Échéance: ${this.formatDate(goal.deadline)}</span>
                </div>
            </div>
        `;
    }

    renderRemindersCard() {
        const reminders = this.reminders.slice(0, 5); // Show only 5 most recent

        return `
            <div class="planning-card reminders-card animate-fade-in">
                <div class="card-header">
                    <i class="fas fa-bell planning-icon-reminders"></i>
                    <h3>Rappels</h3>
                    <button class="btn btn-secondary btn-small" onclick="planningModule.clearAllReminders()">
                        <i class="fas fa-check-double"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="reminders-list">
                        ${reminders.length > 0 ?
                            reminders.map(reminder => this.renderReminder(reminder)).join('') :
                            '<div class="no-reminders">Aucun rappel en attente</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderReminder(reminder) {
        const urgencyColor = this.getUrgencyColor(reminder.urgency);

        return `
            <div class="reminder-item" data-reminder-id="${reminder.id}">
                <div class="reminder-indicator" style="background: ${urgencyColor};"></div>
                <div class="reminder-content">
                    <div class="reminder-text">${reminder.message}</div>
                    <div class="reminder-time">${this.formatReminderTime(reminder.time)}</div>
                </div>
                <button class="reminder-dismiss" onclick="planningModule.dismissReminder('${reminder.id}')"
                        title="Marquer comme lu">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
    }

    // Calendar Management
    setupCalendar() {
        this.calendar = {
            currentDate: new Date(),
            events: new Map(),
            selectedDate: null
        };

        // Load events for current week
        this.loadWeekEvents();
    }

    async loadWeekEvents() {
        const weekStart = this.getWeekStart(this.currentWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        try {
            const response = await fetch(`/api/parent/events?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const events = await response.json();
                events.forEach(event => this.events.set(event.id, event));
            } else {
                this.loadMockEvents();
            }

        } catch (error) {
            console.error('[Planning] Failed to load events:', error);
            this.loadMockEvents();
        }
    }

    getEventsForDate(date) {
        const dateStr = date.toDateString();
        return Array.from(this.events.values()).filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === dateStr;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }

    async addEvent(eventData = null) {
        if (eventData) {
            // Add from WebSocket or API
            this.events.set(eventData.id, eventData);
            this.refreshCalendar();
            return;
        }

        // Show add event modal
        const modal = this.createEventModal();
        document.body.appendChild(modal);
    }

    async addEventForDate(dateString) {
        const date = new Date(dateString);
        const modal = this.createEventModal(date);
        document.body.appendChild(modal);
    }

    createEventModal(preSelectedDate = null) {
        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Ajouter un événement</h3>
                        <button class="modal-close" onclick="this.closest('.event-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form class="event-form" onsubmit="planningModule.submitEvent(event)">
                        <div class="form-group">
                            <label>Titre de l'événement</label>
                            <input type="text" name="title" required class="form-input"
                                   placeholder="ex: Session de mathématiques">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Date</label>
                                <input type="date" name="date" required class="form-input"
                                       value="${preSelectedDate ? this.formatDateInput(preSelectedDate) : ''}">
                            </div>
                            <div class="form-group">
                                <label>Heure</label>
                                <input type="time" name="time" required class="form-input">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Enfant concerné</label>
                            <select name="child" class="form-select">
                                <option value="">Tous</option>
                                <option value="Richy">Richy</option>
                                <option value="Blandine">Blandine</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Type d'événement</label>
                            <select name="type" required class="form-select">
                                <option value="study">Étude</option>
                                <option value="test">Test/Examen</option>
                                <option value="ai_session">Session IA</option>
                                <option value="consultation">Consultation</option>
                                <option value="family">Activité familiale</option>
                                <option value="break">Pause/Loisir</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Matière (optionnel)</label>
                            <select name="subject" class="form-select">
                                <option value="">Sélectionner une matière</option>
                                <option value="math">Mathématiques</option>
                                <option value="french">Français</option>
                                <option value="physics">Physique</option>
                                <option value="chemistry">Chimie</option>
                                <option value="history">Histoire</option>
                                <option value="geography">Géographie</option>
                                <option value="english">Anglais</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Durée (minutes)</label>
                            <input type="number" name="duration" class="form-input" value="60" min="15" max="480">
                        </div>

                        <div class="form-group">
                            <label>Description (optionnel)</label>
                            <textarea name="description" class="form-input" rows="3"
                                      placeholder="Notes ou instructions particulières"></textarea>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="notification" checked>
                                Notification 30 min avant
                            </label>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary"
                                    onclick="this.closest('.event-modal').remove()">
                                Annuler
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Créer l'événement
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        return modal;
    }

    async submitEvent(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const eventData = {
            id: 'event_' + Date.now(),
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            child: formData.get('child'),
            type: formData.get('type'),
            subject: formData.get('subject'),
            duration: parseInt(formData.get('duration')),
            description: formData.get('description'),
            notification: formData.get('notification') === 'on',
            created: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/parent/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                const savedEvent = await response.json();
                this.events.set(savedEvent.id, savedEvent);
                this.refreshCalendar();
                form.closest('.event-modal').remove();

                // Schedule notification if requested
                if (eventData.notification) {
                    this.scheduleNotification(savedEvent);
                }
            }

        } catch (error) {
            console.error('[Planning] Failed to create event:', error);
            // Fallback: add to local storage
            this.events.set(eventData.id, eventData);
            this.refreshCalendar();
            form.closest('.event-modal').remove();
        }
    }

    async editEvent(eventId) {
        const event = this.events.get(eventId);
        if (!event) return;

        const modal = this.createEventModal();
        const form = modal.querySelector('.event-form');

        // Pre-fill form with event data
        form.title.value = event.title;
        form.date.value = event.date;
        form.time.value = event.time;
        form.child.value = event.child || '';
        form.type.value = event.type;
        form.subject.value = event.subject || '';
        form.duration.value = event.duration;
        form.description.value = event.description || '';
        form.notification.checked = event.notification;

        // Update form submission
        form.onsubmit = (e) => this.updateEvent(e, eventId);
        modal.querySelector('.modal-header h3').textContent = 'Modifier l\'événement';
        modal.querySelector('.btn-primary').textContent = 'Sauvegarder';

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Supprimer';
        deleteBtn.onclick = () => this.deleteEvent(eventId);
        form.querySelector('.form-actions').insertBefore(deleteBtn, form.querySelector('.btn-primary'));

        document.body.appendChild(modal);
    }

    async updateEvent(event, eventId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const updatedEvent = {
            ...this.events.get(eventId),
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            child: formData.get('child'),
            type: formData.get('type'),
            subject: formData.get('subject'),
            duration: parseInt(formData.get('duration')),
            description: formData.get('description'),
            notification: formData.get('notification') === 'on',
            updated: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/parent/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(updatedEvent)
            });

            if (response.ok) {
                this.events.set(eventId, updatedEvent);
            }

        } catch (error) {
            console.error('[Planning] Failed to update event:', error);
            this.events.set(eventId, updatedEvent);
        }

        this.refreshCalendar();
        form.closest('.event-modal').remove();
    }

    async deleteEvent(eventId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

        try {
            const response = await fetch(`/api/parent/events/${eventId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.events.delete(eventId);
            }

        } catch (error) {
            console.error('[Planning] Failed to delete event:', error);
            this.events.delete(eventId);
        }

        this.refreshCalendar();

        // Close modal if open
        const modal = document.querySelector('.event-modal');
        if (modal) modal.remove();
    }

    // Goals Management
    async addGoal() {
        const modal = this.createGoalModal();
        document.body.appendChild(modal);
    }

    createGoalModal(goal = null) {
        const isEdit = goal !== null;
        const modal = document.createElement('div');
        modal.className = 'goal-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Modifier l\'objectif' : 'Nouvel objectif'}</h3>
                        <button class="modal-close" onclick="this.closest('.goal-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form class="goal-form" onsubmit="planningModule.submitGoal(event, ${isEdit ? `'${goal.id}'` : 'null'})">
                        <div class="form-group">
                            <label>Titre de l'objectif</label>
                            <input type="text" name="title" required class="form-input"
                                   value="${isEdit ? goal.title : ''}"
                                   placeholder="ex: Améliorer les notes en mathématiques">
                        </div>

                        <div class="form-group">
                            <label>Enfant concerné</label>
                            <select name="child" required class="form-select">
                                <option value="">Sélectionner un enfant</option>
                                <option value="Richy" ${isEdit && goal.child === 'Richy' ? 'selected' : ''}>Richy</option>
                                <option value="Blandine" ${isEdit && goal.child === 'Blandine' ? 'selected' : ''}>Blandine</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Matière</label>
                            <select name="subject" required class="form-select">
                                <option value="">Sélectionner une matière</option>
                                <option value="math" ${isEdit && goal.subject === 'math' ? 'selected' : ''}>Mathématiques</option>
                                <option value="french" ${isEdit && goal.subject === 'french' ? 'selected' : ''}>Français</option>
                                <option value="physics" ${isEdit && goal.subject === 'physics' ? 'selected' : ''}>Physique</option>
                                <option value="chemistry" ${isEdit && goal.subject === 'chemistry' ? 'selected' : ''}>Chimie</option>
                                <option value="general" ${isEdit && goal.subject === 'general' ? 'selected' : ''}>Général</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Échéance</label>
                            <input type="date" name="deadline" required class="form-input"
                                   value="${isEdit ? this.formatDateInput(new Date(goal.deadline)) : ''}">
                        </div>

                        <div class="form-group">
                            <label>Objectif cible</label>
                            <input type="number" name="target" class="form-input" min="0" max="100"
                                   value="${isEdit ? goal.target : '80'}"
                                   placeholder="ex: 80 (%)">
                        </div>

                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" class="form-input" rows="3"
                                      placeholder="Décrivez l'objectif en détail">${isEdit ? goal.description || '' : ''}</textarea>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary"
                                    onclick="this.closest('.goal-modal').remove()">
                                Annuler
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? 'Sauvegarder' : 'Créer l\'objectif'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        return modal;
    }

    async submitGoal(event, goalId = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const goalData = {
            id: goalId || 'goal_' + Date.now(),
            title: formData.get('title'),
            child: formData.get('child'),
            subject: formData.get('subject'),
            deadline: formData.get('deadline'),
            target: parseInt(formData.get('target')),
            description: formData.get('description'),
            progress: goalId ? this.goals.get(goalId).progress : 0,
            created: goalId ? this.goals.get(goalId).created : new Date().toISOString(),
            updated: new Date().toISOString()
        };

        try {
            const url = goalId ? `/api/parent/goals/${goalId}` : '/api/parent/goals';
            const method = goalId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(goalData)
            });

            if (response.ok) {
                const savedGoal = await response.json();
                this.goals.set(savedGoal.id, savedGoal);
            } else {
                this.goals.set(goalData.id, goalData);
            }

        } catch (error) {
            console.error('[Planning] Failed to save goal:', error);
            this.goals.set(goalData.id, goalData);
        }

        this.refreshGoals();
        form.closest('.goal-modal').remove();
    }

    updateGoalProgress(goalData) {
        const goal = this.goals.get(goalData.id);
        if (goal) {
            goal.progress = goalData.progress;
            goal.updated = new Date().toISOString();
            this.refreshGoals();
        }
    }

    // Navigation
    previousWeek() {
        const previousWeek = new Date(this.currentWeek);
        previousWeek.setDate(this.currentWeek.getDate() - 7);
        this.currentWeek = previousWeek;
        this.loadWeekEvents();
        this.refreshCalendar();
    }

    nextWeek() {
        const nextWeek = new Date(this.currentWeek);
        nextWeek.setDate(this.currentWeek.getDate() + 7);
        this.currentWeek = nextWeek;
        this.loadWeekEvents();
        this.refreshCalendar();
    }

    // Notifications
    setupNotifications() {
        // Check for upcoming events every minute
        setInterval(() => {
            this.checkUpcomingEvents();
        }, 60000);

        // Initial check
        this.checkUpcomingEvents();
    }

    checkUpcomingEvents() {
        const now = new Date();
        const threshold = new Date(now.getTime() + this.options.notificationThreshold * 60000);

        Array.from(this.events.values()).forEach(event => {
            if (!event.notification || event.notified) return;

            const eventDateTime = new Date(`${event.date}T${event.time}`);
            if (eventDateTime <= threshold && eventDateTime > now) {
                this.showNotification(event);
                event.notified = true;
            }
        });
    }

    showNotification(event) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Rappel: ${event.title}`, {
                body: `Dans ${this.options.notificationThreshold} minutes`,
                icon: '/favicon.ico'
            });
        }

        // Also add to reminders list
        this.addReminder({
            id: 'reminder_' + Date.now(),
            message: `${event.title} dans ${this.options.notificationThreshold} minutes`,
            time: new Date(),
            urgency: 'high',
            eventId: event.id
        });
    }

    scheduleNotification(event) {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const notificationTime = new Date(eventDateTime.getTime() - this.options.notificationThreshold * 60000);
        const now = new Date();

        if (notificationTime > now) {
            setTimeout(() => {
                this.showNotification(event);
            }, notificationTime.getTime() - now.getTime());
        }
    }

    // Reminders
    addReminder(reminder) {
        this.reminders.unshift(reminder);
        this.refreshReminders();
    }

    dismissReminder(reminderId) {
        this.reminders = this.reminders.filter(r => r.id !== reminderId);
        this.refreshReminders();
    }

    clearAllReminders() {
        this.reminders = [];
        this.refreshReminders();
    }

    // AI Optimization
    handleAIOptimization(optimization) {
        // Show optimization suggestions
        const notification = document.createElement('div');
        notification.className = 'optimization-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🤖</div>
                <div class="notification-text">
                    <h4>Optimisation IA suggérée</h4>
                    <p>${optimization.message}</p>
                </div>
                <div class="notification-actions">
                    <button class="btn btn-small btn-primary" onclick="planningModule.applyOptimization('${optimization.id}')">
                        Appliquer
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Ignorer
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 30000);
    }

    async applyOptimization(optimizationId) {
        try {
            const response = await fetch(`/api/parent/planning/optimization/${optimizationId}/apply`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const result = await response.json();

                // Update events with optimized schedule
                result.events.forEach(event => {
                    this.events.set(event.id, event);
                });

                this.refreshCalendar();
            }

        } catch (error) {
            console.error('[Planning] Failed to apply optimization:', error);
        }

        // Remove notification
        const notification = document.querySelector('.optimization-notification');
        if (notification) notification.remove();
    }

    // Data Management
    async loadPlanningData() {
        try {
            // Load events
            const eventsResponse = await fetch('/api/parent/events', {
                headers: this.getAuthHeaders()
            });

            if (eventsResponse.ok) {
                const events = await eventsResponse.json();
                events.forEach(event => this.events.set(event.id, event));
            } else {
                this.loadMockEvents();
            }

            // Load goals
            const goalsResponse = await fetch('/api/parent/goals', {
                headers: this.getAuthHeaders()
            });

            if (goalsResponse.ok) {
                const goals = await goalsResponse.json();
                goals.forEach(goal => this.goals.set(goal.id, goal));
            } else {
                this.loadMockGoals();
            }

            // Load reminders
            const remindersResponse = await fetch('/api/parent/reminders', {
                headers: this.getAuthHeaders()
            });

            if (remindersResponse.ok) {
                this.reminders = await remindersResponse.json();
            } else {
                this.loadMockReminders();
            }

        } catch (error) {
            console.error('[Planning] Failed to load planning data:', error);
            this.loadMockEvents();
            this.loadMockGoals();
            this.loadMockReminders();
        }
    }

    startRealTimeUpdates() {
        setInterval(() => {
            if (!this.isConnected) {
                this.loadPlanningData();
            }
        }, 300000); // 5 minutes
    }

    // Mock Data
    loadMockEvents() {
        const mockEvents = [
            {
                id: 'event1',
                title: 'Math Richy',
                date: '2025-01-20',
                time: '16:00',
                child: 'Richy',
                type: 'study',
                subject: 'math',
                duration: 60,
                notification: true
            },
            {
                id: 'event2',
                title: 'Session IA Richy',
                date: '2025-01-21',
                time: '17:00',
                child: 'Richy',
                type: 'ai_session',
                subject: 'math',
                duration: 30,
                notification: true
            },
            {
                id: 'event3',
                title: 'BAC Blanc Richy',
                date: '2025-01-24',
                time: '14:00',
                child: 'Richy',
                type: 'test',
                subject: 'math',
                duration: 180,
                notification: true
            }
        ];

        mockEvents.forEach(event => this.events.set(event.id, event));
    }

    loadMockGoals() {
        const mockGoals = [
            {
                id: 'goal1',
                title: 'Richy - Math',
                child: 'Richy',
                subject: 'math',
                progress: 75,
                target: 80,
                deadline: '2025-01-31',
                created: '2025-01-01'
            },
            {
                id: 'goal2',
                title: 'Blandine - Français',
                child: 'Blandine',
                subject: 'french',
                progress: 95,
                target: 90,
                deadline: '2025-01-31',
                created: '2025-01-01'
            },
            {
                id: 'goal3',
                title: 'Temps famille',
                child: 'Tous',
                subject: 'general',
                progress: 60,
                target: 80,
                deadline: '2025-01-31',
                created: '2025-01-01'
            }
        ];

        mockGoals.forEach(goal => this.goals.set(goal.id, goal));
    }

    loadMockReminders() {
        this.reminders = [
            {
                id: 'reminder1',
                message: 'BAC Blanc demain 14h',
                time: new Date(Date.now() - 3600000),
                urgency: 'high'
            },
            {
                id: 'reminder2',
                message: 'Session IA prévue 17h',
                time: new Date(Date.now() - 1800000),
                urgency: 'medium'
            },
            {
                id: 'reminder3',
                message: 'Rapport hebdomadaire prêt',
                time: new Date(Date.now() - 900000),
                urgency: 'low'
            }
        ];
    }

    // Utility Methods
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        return new Date(d.setDate(diff));
    }

    getWeekLabel() {
        const start = this.getWeekStart(this.currentWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const options = { day: 'numeric', month: 'short' };
        return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    formatDateInput(date) {
        return date.toISOString().split('T')[0];
    }

    formatReminderTime(time) {
        const now = new Date();
        const reminderTime = new Date(time);
        const diff = now - reminderTime;

        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return `${Math.floor(diff / 86400000)}j`;
    }

    getProgressColor(progress) {
        if (progress >= 80) return 'var(--success-color)';
        if (progress >= 60) return 'var(--warning-color)';
        return 'var(--danger-color)';
    }

    getUrgencyColor(urgency) {
        switch (urgency) {
            case 'high': return 'var(--danger-color)';
            case 'medium': return 'var(--warning-color)';
            case 'low': return 'var(--success-color)';
            default: return 'var(--border-color)';
        }
    }

    getUserId() {
        return localStorage.getItem('parentUserId') || 'parent-user';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('parentToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // UI Refresh Methods
    refreshCalendar() {
        if (window.app && window.app.currentModule === 'planning') {
            const calendarCard = document.querySelector('.calendar-card .card-body');
            if (calendarCard) {
                calendarCard.innerHTML = `
                    <div class="calendar-grid">
                        ${this.renderCalendarHeader()}
                        ${this.renderCalendarWeek()}
                    </div>
                `;
            }
        }
    }

    refreshGoals() {
        if (window.app && window.app.currentModule === 'planning') {
            const goalsList = document.querySelector('.goals-list');
            if (goalsList) {
                const goals = Array.from(this.goals.values());
                goalsList.innerHTML = goals.map(goal => this.renderGoal(goal)).join('');
            }
        }
    }

    refreshReminders() {
        if (window.app && window.app.currentModule === 'planning') {
            const remindersList = document.querySelector('.reminders-list');
            if (remindersList) {
                const reminders = this.reminders.slice(0, 5);
                remindersList.innerHTML = reminders.length > 0 ?
                    reminders.map(reminder => this.renderReminder(reminder)).join('') :
                    '<div class="no-reminders">Aucun rappel en attente</div>';
            }
        }
    }

    // Public API
    async refresh() {
        await this.loadPlanningData();
        this.refreshCalendar();
        this.refreshGoals();
        this.refreshReminders();
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.planningModule = null; // Sera initialisé par main.js
}

export default Planning;