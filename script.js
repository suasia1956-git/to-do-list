/* ================================================================
   TASKFLOW — SMART TASK MANAGER — JavaScript
   
   Features:
   ✅ Full CRUD (Create, Read, Update, Delete) functionality
   ✅ Persist data automatically using window.localStorage
   ✅ Advanced filtering (All, Active, Completed)
   ✅ Dynamic DOM elements with delegated event listeners
   ✅ State-driven architecture — single source of truth
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // STATE — Single source of truth
    // ==========================================
    const STORAGE_KEY = 'taskflow-todos';
    const THEME_KEY = 'taskflow-theme';

    let state = {
        todos: [],
        filter: 'all', // 'all' | 'active' | 'completed'
    };

    // ==========================================
    // DOM REFERENCES
    // ==========================================
    const dom = {
        htmlEl: document.documentElement,
        themeToggle: document.getElementById('theme-toggle'),
        greetingText: document.getElementById('greeting-text'),
        taskForm: document.getElementById('add-task-form'),
        taskInput: document.getElementById('task-input'),
        taskList: document.getElementById('task-list'),
        emptyState: document.getElementById('empty-state'),
        emptyStateTitle: document.getElementById('empty-state-title'),
        emptyStateText: document.getElementById('empty-state-text'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        clearCompletedBtn: document.getElementById('clear-completed-btn'),
        countAll: document.getElementById('count-all'),
        countActive: document.getElementById('count-active'),
        countCompleted: document.getElementById('count-completed'),
        statTotal: document.getElementById('stat-total'),
        statActive: document.getElementById('stat-active'),
        statDone: document.getElementById('stat-done'),
        progressRingFill: document.getElementById('progress-ring-fill'),
        progressPercent: document.getElementById('progress-percent'),
    };

    // ==========================================
    // LOCALSTORAGE — Persistence
    // ==========================================

    /** Load todos from localStorage */
    function loadTodos() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                state.todos = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load todos from localStorage:', e);
            state.todos = [];
        }
    }

    /** Save todos to localStorage */
    function saveTodos() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
        } catch (e) {
            console.warn('Failed to save todos to localStorage:', e);
        }
    }

    // ==========================================
    // CRUD OPERATIONS
    // ==========================================

    /** CREATE — Add a new todo */
    function addTodo(text) {
        const trimmed = text.trim();
        if (!trimmed) return;

        const newTodo = {
            id: generateId(),
            text: trimmed,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        state.todos.unshift(newTodo);
        saveTodos();
        render();
    }

    /** READ — Get filtered todos based on current filter */
    function getFilteredTodos() {
        switch (state.filter) {
            case 'active':
                return state.todos.filter(t => !t.completed);
            case 'completed':
                return state.todos.filter(t => t.completed);
            default:
                return [...state.todos];
        }
    }

    /** UPDATE — Toggle completed status */
    function toggleTodo(id) {
        const todo = state.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            render();
        }
    }

    /** UPDATE — Edit todo text */
    function updateTodoText(id, newText) {
        const trimmed = newText.trim();
        if (!trimmed) return;

        const todo = state.todos.find(t => t.id === id);
        if (todo) {
            todo.text = trimmed;
            saveTodos();
            render();
        }
    }

    /** DELETE — Remove a single todo */
    function deleteTodo(id) {
        const taskEl = dom.taskList.querySelector(`[data-id="${id}"]`);
        if (taskEl) {
            taskEl.classList.add('removing');
            taskEl.addEventListener('animationend', () => {
                state.todos = state.todos.filter(t => t.id !== id);
                saveTodos();
                render();
            }, { once: true });
        } else {
            state.todos = state.todos.filter(t => t.id !== id);
            saveTodos();
            render();
        }
    }

    /** DELETE — Clear all completed todos */
    function clearCompleted() {
        const completedEls = dom.taskList.querySelectorAll('.task-item.completed');
        if (completedEls.length === 0) return;

        let animationCount = 0;
        completedEls.forEach((el, i) => {
            setTimeout(() => {
                el.classList.add('removing');
                animationCount++;
                el.addEventListener('animationend', () => {
                    animationCount--;
                    if (animationCount === 0) {
                        state.todos = state.todos.filter(t => !t.completed);
                        saveTodos();
                        render();
                    }
                }, { once: true });
            }, i * 80);
        });
    }

    // ==========================================
    // RENDERING — Dynamic DOM Creation
    // ==========================================

    /** Main render function — re-renders the entire task list */
    function render() {
        const filtered = getFilteredTodos();
        
        // Clear the list
        dom.taskList.innerHTML = '';

        // Render each task item
        filtered.forEach((todo, index) => {
            const li = createTaskElement(todo, index);
            dom.taskList.appendChild(li);
        });

        // Update UI state
        updateCounts();
        updateEmptyState(filtered.length);
        updateFilterButtons();
        updateProgressRing();
    }

    /** Create a single task DOM element dynamically */
    function createTaskElement(todo, index) {
        const li = document.createElement('li');
        li.className = `task-item${todo.completed ? ' completed' : ''}`;
        li.dataset.id = todo.id;
        li.style.animationDelay = `${index * 0.05}s`;

        const dateStr = formatDate(todo.createdAt);

        li.innerHTML = `
            <label class="task-item__checkbox">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} aria-label="Mark as ${todo.completed ? 'active' : 'completed'}">
                <span class="task-item__checkmark">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </span>
            </label>
            <div class="task-item__content">
                <span class="task-item__text">${escapeHtml(todo.text)}</span>
                <span class="task-item__date">${dateStr}</span>
            </div>
            <div class="task-item__actions">
                <button class="task-action-btn task-action-btn--edit" title="Edit task" data-action="edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="task-action-btn task-action-btn--delete" title="Delete task" data-action="delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;

        return li;
    }

    /** Enter inline edit mode for a task */
    function enterEditMode(taskEl, todoId) {
        const todo = state.todos.find(t => t.id === todoId);
        if (!todo) return;

        const contentEl = taskEl.querySelector('.task-item__content');
        const textEl = contentEl.querySelector('.task-item__text');
        const dateEl = contentEl.querySelector('.task-item__date');
        const actionsEl = taskEl.querySelector('.task-item__actions');

        // Hide original text and actions
        textEl.style.display = 'none';
        dateEl.style.display = 'none';
        actionsEl.style.display = 'none';

        // Create edit input
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-item__edit-input';
        editInput.value = todo.text;
        editInput.maxLength = 200;
        contentEl.appendChild(editInput);
        editInput.focus();
        editInput.select();

        // Save on Enter, cancel on Escape
        const saveEdit = () => {
            const newText = editInput.value.trim();
            if (newText && newText !== todo.text) {
                updateTodoText(todoId, newText);
            } else {
                // Cancel — just re-render
                render();
            }
        };

        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                render();
            }
        });

        editInput.addEventListener('blur', () => {
            // Small timeout to prevent race conditions
            setTimeout(saveEdit, 100);
        });
    }

    // ==========================================
    // UI UPDATES
    // ==========================================

    /** Update filter counts */
    function updateCounts() {
        const total = state.todos.length;
        const completed = state.todos.filter(t => t.completed).length;
        const active = total - completed;

        dom.countAll.textContent = total;
        dom.countActive.textContent = active;
        dom.countCompleted.textContent = completed;
        dom.statTotal.textContent = total;
        dom.statActive.textContent = active;
        dom.statDone.textContent = completed;
    }

    /** Update active filter button styling */
    function updateFilterButtons() {
        dom.filterBtns.forEach(btn => {
            if (btn.dataset.filter === state.filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /** Show / hide empty state */
    function updateEmptyState(visibleCount) {
        if (visibleCount === 0) {
            dom.emptyState.classList.add('show');
            if (state.todos.length === 0) {
                dom.emptyStateTitle.textContent = 'No tasks yet';
                dom.emptyStateText.textContent = 'Add your first task above to get started!';
            } else if (state.filter === 'active') {
                dom.emptyStateTitle.textContent = 'All done! 🎉';
                dom.emptyStateText.textContent = 'You\'ve completed all your tasks. Great job!';
            } else if (state.filter === 'completed') {
                dom.emptyStateTitle.textContent = 'No completed tasks';
                dom.emptyStateText.textContent = 'Complete some tasks and they\'ll show up here.';
            }
        } else {
            dom.emptyState.classList.remove('show');
        }
    }

    /** Update progress ring */
    function updateProgressRing() {
        const total = state.todos.length;
        const completed = state.todos.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        dom.progressRingFill.setAttribute('stroke-dasharray', `${percent}, 100`);
        dom.progressPercent.textContent = `${percent}%`;
    }

    // ==========================================
    // EVENT LISTENERS — Delegated
    // ==========================================

    /** Form submit — CREATE */
    dom.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = dom.taskInput.value;
        if (text.trim()) {
            addTodo(text);
            dom.taskInput.value = '';
            dom.taskInput.focus();
        } else {
            // Shake animation for empty input
            dom.taskInput.closest('.add-task__input-wrapper').style.animation = 'shake 0.4s ease';
            setTimeout(() => {
                dom.taskInput.closest('.add-task__input-wrapper').style.animation = '';
            }, 400);
        }
    });

    /** Task list — DELEGATED event listeners for checkbox, edit, delete */
    dom.taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const todoId = taskItem.dataset.id;

        // Handle checkbox click
        const checkbox = e.target.closest('.task-item__checkbox');
        if (checkbox) {
            // Add visual feedback
            taskItem.classList.add('completing');
            setTimeout(() => {
                toggleTodo(todoId);
            }, 250);
            return;
        }

        // Handle action buttons
        const actionBtn = e.target.closest('.task-action-btn');
        if (actionBtn) {
            const action = actionBtn.dataset.action;
            if (action === 'edit') {
                enterEditMode(taskItem, todoId);
            } else if (action === 'delete') {
                deleteTodo(todoId);
            }
            return;
        }
    });

    /** Filter buttons */
    dom.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.filter = btn.dataset.filter;
            render();
        });
    });

    /** Clear completed */
    dom.clearCompletedBtn.addEventListener('click', clearCompleted);

    /** Theme toggle */
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    dom.htmlEl.setAttribute('data-theme', savedTheme);

    dom.themeToggle.addEventListener('click', () => {
        const current = dom.htmlEl.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        dom.htmlEl.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
    });

    // ==========================================
    // UTILITIES
    // ==========================================

    /** Generate a unique ID */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    /** Escape HTML to prevent XSS */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /** Format date to a readable string */
    function formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    }

    /** Set dynamic greeting based on time of day */
    function setGreeting() {
        const hour = new Date().getHours();
        let greeting;

        if (hour >= 5 && hour < 12) {
            greeting = 'Good Morning ☀️';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good Afternoon 🌤️';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'Good Evening 🌅';
        } else {
            greeting = 'Good Night 🌙';
        }

        dom.greetingText.textContent = greeting;
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        setGreeting();
        loadTodos();
        render();

        // Focus input for immediate task entry
        dom.taskInput.focus();
    }

    init();

});
