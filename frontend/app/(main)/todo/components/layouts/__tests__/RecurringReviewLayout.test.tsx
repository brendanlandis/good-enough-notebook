import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecurringReviewLayout from '../RecurringReviewLayout';
import type { TransformedLayout } from '@/app/lib/layoutTransformers';
import type { LayoutRendererProps } from '../types';
import type { Todo, Project, RecurrenceType } from '@/app/types/index';

// Mock TodoSections component
vi.mock('../../TodoSections', () => ({
  default: ({ sections, incidentals }: any) => (
    <div data-testid="todo-sections">
      {sections && sections.length > 0 && (
        <div data-testid="sections">Sections: {sections.length}</div>
      )}
      {incidentals && incidentals.length > 0 && (
        <div data-testid="incidentals">Incidentals: {incidentals.length}</div>
      )}
    </div>
  ),
}));

// Helper to create minimal todo
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

// Helper to create minimal project
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

describe('RecurringReviewLayout', () => {
  const mockProps = {
    onComplete: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onWorkSession: vi.fn(),
    onRemoveWorkSession: vi.fn(),
    onSkipRecurring: vi.fn(),
    onEditProject: vi.fn(),
    selectedRulesetId: 'recurring',
  };

  describe('empty states', () => {
    it('should display "no recurring tasks" when there are no tasks', () => {
      const transformedData: TransformedLayout = {
        recurringReviewSections: new Map(),
        recurringReviewIncidentals: new Map(),
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('no recurring tasks')).toBeDefined();
    });

    it('should display "no recurring tasks" when sections map is undefined', () => {
      const transformedData: TransformedLayout = {};

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('no recurring tasks')).toBeDefined();
    });
  });

  describe('recurrence type labels', () => {
    it('should display "every day" for daily recurrence', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Daily task',
        isRecurring: true,
        recurrenceType: 'daily',
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('daily', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('every day')).toBeDefined();
    });

    it('should display "every X days" with interval for every x days recurrence', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Every 3 days task',
        isRecurring: true,
        recurrenceType: 'every x days',
        recurrenceInterval: 3,
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('every x days', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('every x days', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('every x days')).toBeDefined();
    });

    it('should display "weekly" for weekly recurrence', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Weekly task',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceDayOfWeek: 1,
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('weekly', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('weekly', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('weekly')).toBeDefined();
    });

    it('should display "monthly (by date)" for monthly date recurrence', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Monthly task',
        isRecurring: true,
        recurrenceType: 'monthly date',
        recurrenceDayOfMonth: 15,
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('monthly date', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('monthly date', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('monthly (by date)')).toBeDefined();
    });

    it('should display "full moon" for full moon recurrence', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Full moon task',
        isRecurring: true,
        recurrenceType: 'full moon',
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('full moon', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('full moon', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('full moon')).toBeDefined();
    });
  });

  describe('rendering sections and incidentals', () => {
    it('should render sections when they exist', () => {
      const project = createProject({
        documentId: 'project-1',
        title: 'Test Project',
      });

      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Project task',
        isRecurring: true,
        recurrenceType: 'daily',
        project: project,
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', [{ ...project, todos: [todo] }]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: new Map(),
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('every day')).toBeDefined();
      expect(screen.getByText('Test Project')).toBeDefined();
      expect(screen.getByText('Project task')).toBeDefined();
    });

    it('should render incidentals when they exist', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Incidental task',
        isRecurring: true,
        recurrenceType: 'daily',
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('daily', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('every day')).toBeDefined();
      expect(screen.getByText('incidentals')).toBeDefined();
      expect(screen.getByText('Incidental task')).toBeDefined();
    });

    it('should render both sections and incidentals when both exist', () => {
      const project = createProject({
        documentId: 'project-1',
        title: 'Test Project',
      });

      const projectTodo = createTodo({
        documentId: 'todo-1',
        title: 'Project task',
        isRecurring: true,
        recurrenceType: 'daily',
        project: project,
      });

      const incidentalTodo = createTodo({
        documentId: 'todo-2',
        title: 'Incidental task',
        isRecurring: true,
        recurrenceType: 'daily',
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', [{ ...project, todos: [projectTodo] }]);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('daily', [incidentalTodo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('every day')).toBeDefined();
      expect(screen.getByText('Test Project')).toBeDefined();
      expect(screen.getByText('Project task')).toBeDefined();
      expect(screen.getByText('incidentals')).toBeDefined();
      expect(screen.getByText('Incidental task')).toBeDefined();
    });
  });

  describe('multiple recurrence types', () => {
    it('should render multiple recurrence type sections', () => {
      const dailyTodo = createTodo({
        documentId: 'todo-1',
        title: 'Daily task',
        isRecurring: true,
        recurrenceType: 'daily',
      });

      const weeklyTodo = createTodo({
        documentId: 'todo-2',
        title: 'Weekly task',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceDayOfWeek: 1,
      });

      const monthlyTodo = createTodo({
        documentId: 'todo-3',
        title: 'Monthly task',
        isRecurring: true,
        recurrenceType: 'monthly date',
        recurrenceDayOfMonth: 15,
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', []);
      sections.set('weekly', []);
      sections.set('monthly date', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('daily', [dailyTodo]);
      incidentals.set('weekly', [weeklyTodo]);
      incidentals.set('monthly date', [monthlyTodo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('every day')).toBeDefined();
      expect(screen.getByText('weekly')).toBeDefined();
      expect(screen.getByText('monthly (by date)')).toBeDefined();
    });

    it('should not render sections for recurrence types with no tasks', () => {
      const dailyTodo = createTodo({
        documentId: 'todo-1',
        title: 'Daily task',
        isRecurring: true,
        recurrenceType: 'daily',
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', []);
      // Weekly is not in the map, so it should not render

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('daily', [dailyTodo]);
      // Weekly is not in the map, so it should not render

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      render(<RecurringReviewLayout {...props} />);

      expect(screen.getByText('every day')).toBeDefined();
      expect(screen.queryByText('weekly')).toBeNull();
    });
  });

  describe('CSS structure', () => {
    it('should wrap content in todos-container', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Daily task',
        isRecurring: true,
        recurrenceType: 'daily',
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('daily', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      const { container } = render(<RecurringReviewLayout {...props} />);

      const todosContainer = container.querySelector('.todos-container');
      expect(todosContainer).toBeDefined();
    });

    it('should use todo-section class for each recurrence type', () => {
      const todo = createTodo({
        documentId: 'todo-1',
        title: 'Daily task',
        isRecurring: true,
        recurrenceType: 'daily',
      });

      const sections = new Map<RecurrenceType, any[]>();
      sections.set('daily', []);

      const incidentals = new Map<RecurrenceType, Todo[]>();
      incidentals.set('daily', [todo]);

      const transformedData: TransformedLayout = {
        recurringReviewSections: sections,
        recurringReviewIncidentals: incidentals,
      };

      const props: LayoutRendererProps = {
        ...mockProps,
        transformedData,
      };

      const { container } = render(<RecurringReviewLayout {...props} />);

      const todoSection = container.querySelector('.todo-section');
      expect(todoSection).toBeDefined();
    });
  });
});
