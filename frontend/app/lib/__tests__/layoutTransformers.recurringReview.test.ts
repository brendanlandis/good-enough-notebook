import { describe, it, expect, beforeEach } from 'vitest';
import { transformLayout } from '../layoutTransformers';
import type { RawTodoData } from '../layoutTransformers';
import type { LayoutRuleset, Todo, Project, RecurrenceType } from '@/app/types/index';

// Helper to create minimal todo for testing
function createTodo(overrides: Partial<Todo>): Todo {
  return {
    id: 1,
    documentId: 'test-1',
    title: 'Test task',
    description: [],
    completed: false,
    completedAt: null,
    dueDate: null,
    displayDate: null,
    displayDateOffset: null,
    isRecurring: false,
    recurrenceType: 'none',
    recurrenceInterval: null,
    recurrenceDayOfWeek: null,
    recurrenceDayOfMonth: null,
    recurrenceWeekOfMonth: null,
    recurrenceDayOfWeekMonthly: null,
    recurrenceMonth: null,
    category: null,
    trackingUrl: null,
    purchaseUrl: null,
    price: null,
    wishListCategory: null,
    soon: false,
    long: false,
    workSessions: null,
    project: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    publishedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Helper to create a minimal project
function createProject(overrides: Partial<Project>): Project {
  return {
    id: 1,
    documentId: 'project-1',
    title: 'Test Project',
    description: [],
    world: 'life stuff',
    importance: 'normal',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    publishedAt: '2024-01-01T00:00:00Z',
    todos: [],
    ...overrides,
  };
}

describe('layoutTransformers - recurring-review', () => {
  let recurringReviewRuleset: LayoutRuleset;

  beforeEach(() => {
    recurringReviewRuleset = {
      id: 'recurring',
      name: 'recurring',
      showRecurring: true,
      showNonRecurring: false,
      visibleWorlds: null,
      visibleCategories: null,
      sortBy: 'alphabetical',
      groupBy: 'recurring-review',
    };
  });

  describe('basic functionality', () => {
    it('should return empty structure when there are no recurring todos', () => {
      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [],
        recurringCategoryGroups: [],
        recurringIncidentals: [],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      expect(result.recurringReviewSections).toBeDefined();
      expect(result.recurringReviewSections?.size).toBe(0);
    });

    it('should group todos by recurrence type', () => {
      const dailyTodo = createTodo({
        documentId: 'todo-1',
        title: 'Daily task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
      });

      const weeklyTodo = createTodo({
        documentId: 'todo-2',
        title: 'Weekly task',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceDayOfWeek: 1,
        completed: false,
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [],
        recurringCategoryGroups: [],
        recurringIncidentals: [dailyTodo, weeklyTodo],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      // Incidentals only appear in recurringReviewIncidentals, not sections
      expect(result.recurringReviewIncidentals?.size).toBe(2);
      expect(result.recurringReviewIncidentals?.has('daily')).toBe(true);
      expect(result.recurringReviewIncidentals?.has('weekly')).toBe(true);
      expect(result.recurringReviewIncidentals?.get('daily')?.length).toBe(1);
      expect(result.recurringReviewIncidentals?.get('weekly')?.length).toBe(1);
    });

    it('should exclude completed recurring todos', () => {
      const incompleteTodo = createTodo({
        documentId: 'todo-1',
        title: 'Incomplete task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
      });

      const completedTodo = createTodo({
        documentId: 'todo-2',
        title: 'Completed task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: true,
        completedAt: '2024-01-01T12:00:00Z',
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [],
        recurringCategoryGroups: [],
        recurringIncidentals: [incompleteTodo, completedTodo],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      const dailyIncidentals = result.recurringReviewIncidentals?.get('daily');
      expect(dailyIncidentals?.length).toBe(1);
      expect(dailyIncidentals?.[0].documentId).toBe('todo-1');
    });
  });

  describe('organization within recurrence types', () => {
    it('should organize todos by project, then category, then incidentals', () => {
      const project = createProject({
        documentId: 'project-1',
        title: 'Test Project',
      });

      const projectTodo = createTodo({
        documentId: 'todo-1',
        title: 'Project task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        project: project,
      });

      const categoryTodo = createTodo({
        documentId: 'todo-2',
        title: 'Category task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        category: 'home chores',
      });

      const incidentalTodo = createTodo({
        documentId: 'todo-3',
        title: 'Incidental task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [{ ...project, todos: [projectTodo] }],
        recurringCategoryGroups: [
          {
            title: 'home chores',
            todos: [categoryTodo],
          },
        ],
        recurringIncidentals: [incidentalTodo],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      const dailySections = result.recurringReviewSections?.get('daily');
      const dailyIncidentals = result.recurringReviewIncidentals?.get('daily');

      expect(dailySections?.length).toBe(2); // 1 project + 1 category
      expect(dailyIncidentals?.length).toBe(1);

      // Check that project comes first
      expect('documentId' in dailySections![0]).toBe(true);
      expect((dailySections![0] as Project).documentId).toBe('project-1');

      // Check that category comes second
      expect((dailySections![1] as any).title).toBe('home chores');
    });

    it('should sort todos alphabetically within each group', () => {
      const todo1 = createTodo({
        documentId: 'todo-1',
        title: 'Zebra task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        category: 'home chores',
      });

      const todo2 = createTodo({
        documentId: 'todo-2',
        title: 'Apple task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        category: 'home chores',
      });

      const todo3 = createTodo({
        documentId: 'todo-3',
        title: 'Banana task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        category: 'home chores',
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [],
        recurringCategoryGroups: [
          {
            title: 'home chores',
            todos: [todo1, todo2, todo3],
          },
        ],
        recurringIncidentals: [],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      const dailySections = result.recurringReviewSections?.get('daily');
      const choresTodos = (dailySections![0] as any).todos;

      expect(choresTodos[0].title).toBe('Apple task');
      expect(choresTodos[1].title).toBe('Banana task');
      expect(choresTodos[2].title).toBe('Zebra task');
    });
  });

  describe('recurrence type coverage', () => {
    const recurrenceTypes: Array<{ type: RecurrenceType; extraFields?: Partial<Todo> }> = [
      { type: 'daily' },
      { type: 'every x days', extraFields: { recurrenceInterval: 3 } },
      { type: 'weekly', extraFields: { recurrenceDayOfWeek: 1 } },
      { type: 'biweekly', extraFields: { recurrenceDayOfWeek: 1 } },
      { type: 'monthly date', extraFields: { recurrenceDayOfMonth: 15 } },
      {
        type: 'monthly day',
        extraFields: { recurrenceWeekOfMonth: 2, recurrenceDayOfWeekMonthly: 1 },
      },
      { type: 'annually', extraFields: { recurrenceMonth: 3, recurrenceDayOfMonth: 15 } },
      { type: 'full moon' },
      { type: 'new moon' },
      { type: 'every season' },
      { type: 'winter solstice' },
      { type: 'spring equinox' },
      { type: 'summer solstice' },
      { type: 'autumn equinox' },
    ];

    recurrenceTypes.forEach(({ type, extraFields }) => {
      it(`should handle ${type} recurrence type`, () => {
        const todo = createTodo({
          documentId: 'todo-1',
          title: `${type} task`,
          isRecurring: true,
          recurrenceType: type,
          completed: false,
          ...extraFields,
        });

        const rawData: RawTodoData = {
          projects: [],
          categoryGroups: [],
          incidentals: [],
          recurringProjects: [],
          recurringCategoryGroups: [],
          recurringIncidentals: [todo],
        };

        const result = transformLayout(rawData, recurringReviewRuleset);

        expect(result.recurringReviewIncidentals?.has(type)).toBe(true);
        const incidentals = result.recurringReviewIncidentals?.get(type);
        expect(incidentals?.length).toBe(1);
        expect(incidentals?.[0].documentId).toBe('todo-1');
      });
    });
  });

  describe('multiple todos per recurrence type', () => {
    it('should handle multiple projects with the same recurrence type', () => {
      const project1 = createProject({
        documentId: 'project-1',
        title: 'Alpha Project',
      });

      const project2 = createProject({
        documentId: 'project-2',
        title: 'Beta Project',
      });

      const todo1 = createTodo({
        documentId: 'todo-1',
        title: 'Task 1',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        project: project1,
      });

      const todo2 = createTodo({
        documentId: 'todo-2',
        title: 'Task 2',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        project: project2,
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [
          { ...project1, todos: [todo1] },
          { ...project2, todos: [todo2] },
        ],
        recurringCategoryGroups: [],
        recurringIncidentals: [],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      const dailySections = result.recurringReviewSections?.get('daily');
      expect(dailySections?.length).toBe(2);

      // Check alphabetical order
      expect((dailySections![0] as Project).title).toBe('Alpha Project');
      expect((dailySections![1] as Project).title).toBe('Beta Project');
    });

    it('should handle multiple categories with the same recurrence type', () => {
      const todo1 = createTodo({
        documentId: 'todo-1',
        title: 'Task 1',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceDayOfWeek: 1,
        completed: false,
        category: 'home chores',
      });

      const todo2 = createTodo({
        documentId: 'todo-2',
        title: 'Task 2',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceDayOfWeek: 1,
        completed: false,
        category: 'studio chores',
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [],
        recurringCategoryGroups: [
          { title: 'home chores', todos: [todo1] },
          { title: 'studio chores', todos: [todo2] },
        ],
        recurringIncidentals: [],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      const weeklySections = result.recurringReviewSections?.get('weekly');
      expect(weeklySections?.length).toBe(2);

      // Check alphabetical order
      expect((weeklySections![0] as any).title).toBe('home chores');
      expect((weeklySections![1] as any).title).toBe('studio chores');
    });
  });

  describe('edge cases', () => {
    it('should handle empty projects', () => {
      const project = createProject({
        documentId: 'project-1',
        title: 'Empty Project',
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [{ ...project, todos: [] }],
        recurringCategoryGroups: [],
        recurringIncidentals: [],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      expect(result.recurringReviewSections?.size).toBe(0);
    });

    it('should handle todos from all sources (projects, categories, incidentals)', () => {
      const project = createProject({
        documentId: 'project-1',
        title: 'Test Project',
      });

      const projectTodo = createTodo({
        documentId: 'todo-1',
        title: 'Project task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        project: project,
      });

      const categoryTodo = createTodo({
        documentId: 'todo-2',
        title: 'Category task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
        category: 'home chores',
      });

      const incidentalTodo = createTodo({
        documentId: 'todo-3',
        title: 'Incidental task',
        isRecurring: true,
        recurrenceType: 'daily',
        completed: false,
      });

      const rawData: RawTodoData = {
        projects: [],
        categoryGroups: [],
        incidentals: [],
        recurringProjects: [{ ...project, todos: [projectTodo] }],
        recurringCategoryGroups: [{ title: 'home chores', todos: [categoryTodo] }],
        recurringIncidentals: [incidentalTodo],
      };

      const result = transformLayout(rawData, recurringReviewRuleset);

      expect(result.recurringReviewSections?.get('daily')?.length).toBe(2); // project + category
      expect(result.recurringReviewIncidentals?.get('daily')?.length).toBe(1);
    });
  });
});
