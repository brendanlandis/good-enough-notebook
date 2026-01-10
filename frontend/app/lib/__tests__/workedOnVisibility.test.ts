import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Todo } from '@/app/types/index';
import * as completedTaskConfig from '../completedTaskVisibilityConfig';

// Mock the config module to control visibility minutes
vi.mock('../completedTaskVisibilityConfig', () => ({
  getCompletedTaskVisibilityMinutes: vi.fn(() => 15), // Default 15 minutes
  setCachedVisibilityMinutes: vi.fn(),
  fetchVisibilityMinutesFromStrapi: vi.fn(),
  saveVisibilityMinutesToStrapi: vi.fn(),
}));

describe('Worked-On Task Visibility Logic', () => {
  // Helper to create a todo with work sessions
  function createTodoWithWorkSessions(workSessions: Array<{ date: string; timestamp: string }>): Todo {
    return {
      id: 1,
      documentId: 'test-long-task',
      title: 'Test long task',
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
      category: 'test',
      project: null,
      trackingUrl: null,
      purchaseUrl: null,
      price: null,
      wishListCategory: null,
      soon: false,
      long: true,
      workSessions,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-01T00:00:00.000Z',
    };
  }

  // Helper function to simulate the visibility logic from page.tsx
  function shouldBeVisible(todo: Todo, now: Date, visibilityMinutes: number): boolean {
    // If it's a long todo with recent work sessions, check visibility window
    if (todo.long && todo.workSessions && todo.workSessions.length > 0) {
      // Find the most recent work session
      const mostRecentSession = todo.workSessions
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (mostRecentSession) {
        const sessionTime = new Date(mostRecentSession.timestamp);
        const minutesSinceSession = (now.getTime() - sessionTime.getTime()) / (1000 * 60);
        
        if (minutesSinceSession <= visibilityMinutes) {
          // Recent work session, hide from main list
          return false;
        }
      }
    }
    
    return true;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default 15 minutes
    vi.mocked(completedTaskConfig.getCompletedTaskVisibilityMinutes).mockReturnValue(15);
  });

  describe('Time-Based Visibility', () => {
    it('should hide task immediately after work session (within visibility window)', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const recentSessionTime = new Date('2026-01-05T11:59:00.000Z'); // 1 minute ago
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: recentSessionTime.toISOString() },
      ]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(false); // Should be hidden
    });

    it('should show task after visibility window expires', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const oldSessionTime = new Date('2026-01-05T11:30:00.000Z'); // 30 minutes ago
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: oldSessionTime.toISOString() },
      ]);

      const visibilityMinutes = 15; // 15 minute window
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(true); // Should be visible again
    });

    it('should hide task at exact visibility window boundary', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const sessionTime = new Date('2026-01-05T11:45:00.000Z'); // Exactly 15 minutes ago
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: sessionTime.toISOString() },
      ]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(false); // Should still be hidden (<=)
    });

    it('should use custom visibility minutes from config', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const sessionTime = new Date('2026-01-05T11:00:00.000Z'); // 60 minutes ago
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: sessionTime.toISOString() },
      ]);

      // Test with 90 minute window
      let visible = shouldBeVisible(todo, now, 90);
      expect(visible).toBe(false); // Hidden with 90 minute window

      // Test with 30 minute window
      visible = shouldBeVisible(todo, now, 30);
      expect(visible).toBe(true); // Visible with 30 minute window
    });
  });

  describe('Multiple Work Sessions', () => {
    it('should use most recent work session for visibility check', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-03', timestamp: '2026-01-03T10:00:00.000Z' }, // Old
        { date: '2026-01-04', timestamp: '2026-01-04T10:00:00.000Z' }, // Older
        { date: '2026-01-05', timestamp: '2026-01-05T11:55:00.000Z' }, // Most recent (5 mins ago)
      ]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(false); // Should use most recent session (5 mins ago)
    });

    it('should show task when most recent session is outside window', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-03', timestamp: '2026-01-03T10:00:00.000Z' }, // Old
        { date: '2026-01-04', timestamp: '2026-01-04T10:00:00.000Z' }, // Older
        { date: '2026-01-05', timestamp: '2026-01-05T11:00:00.000Z' }, // Most recent (60 mins ago)
      ]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(true); // Should be visible (most recent is 60 mins ago)
    });
  });

  describe('Edge Cases', () => {
    it('should show task with no work sessions', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const todo = createTodoWithWorkSessions([]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(true); // Should be visible
    });

    it('should show task with null work sessions', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const todo = {
        ...createTodoWithWorkSessions([]),
        workSessions: null,
      };

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(true); // Should be visible
    });

    it('should show non-long task regardless of work sessions', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const recentSessionTime = new Date('2026-01-05T11:59:00.000Z'); // 1 minute ago
      
      const todo = {
        ...createTodoWithWorkSessions([
          { date: '2026-01-05', timestamp: recentSessionTime.toISOString() },
        ]),
        long: false, // Not a long task
      };

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(true); // Should be visible (not a long task)
    });

    it('should handle future timestamps gracefully', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const futureSessionTime = new Date('2026-01-05T13:00:00.000Z'); // 1 hour in future
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: futureSessionTime.toISOString() },
      ]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      // Future timestamp results in negative minutes since session (< 0)
      // Negative values are <= visibilityMinutes, so task is hidden
      expect(visible).toBe(false);
    });
  });

  describe('Integration with Completed Task Visibility', () => {
    it('should use same visibility minutes as completed tasks', () => {
      // Mock the config to return 30 minutes
      vi.mocked(completedTaskConfig.getCompletedTaskVisibilityMinutes).mockReturnValue(30);
      
      const now = new Date('2026-01-05T12:00:00.000Z');
      const sessionTime = new Date('2026-01-05T11:35:00.000Z'); // 25 minutes ago
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: sessionTime.toISOString() },
      ]);

      const visibilityMinutes = completedTaskConfig.getCompletedTaskVisibilityMinutes();
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(completedTaskConfig.getCompletedTaskVisibilityMinutes).toHaveBeenCalled();
      expect(visible).toBe(false); // Should be hidden with 30 minute window
    });

    it('should update visibility when config changes', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const sessionTime = new Date('2026-01-05T11:35:00.000Z'); // 25 minutes ago
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: sessionTime.toISOString() },
      ]);

      // First with 15 minute window
      vi.mocked(completedTaskConfig.getCompletedTaskVisibilityMinutes).mockReturnValue(15);
      let visibilityMinutes = completedTaskConfig.getCompletedTaskVisibilityMinutes();
      let visible = shouldBeVisible(todo, now, visibilityMinutes);
      expect(visible).toBe(true); // Visible with 15 minute window

      // Then with 30 minute window
      vi.mocked(completedTaskConfig.getCompletedTaskVisibilityMinutes).mockReturnValue(30);
      visibilityMinutes = completedTaskConfig.getCompletedTaskVisibilityMinutes();
      visible = shouldBeVisible(todo, now, visibilityMinutes);
      expect(visible).toBe(false); // Hidden with 30 minute window
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle working on task multiple times in a day', () => {
      const now = new Date('2026-01-05T15:00:00.000Z'); // 3 PM
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: '2026-01-05T09:00:00.000Z' }, // 9 AM (6 hours ago)
        { date: '2026-01-05', timestamp: '2026-01-05T12:00:00.000Z' }, // 12 PM (3 hours ago)
        { date: '2026-01-05', timestamp: '2026-01-05T14:50:00.000Z' }, // 2:50 PM (10 mins ago)
      ]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(false); // Should be hidden (most recent is 10 mins ago)
    });

    it('should show task worked on yesterday but not today', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-04', timestamp: '2026-01-04T14:00:00.000Z' }, // Yesterday
      ]);

      const visibilityMinutes = 15;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(true); // Should be visible (yesterday's session is old)
    });

    it('should handle zero visibility minutes (hides only at exactly 0 minutes)', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const sessionTime = new Date('2026-01-05T11:59:59.000Z'); // 1 second ago (~0.0167 minutes)
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-05', timestamp: sessionTime.toISOString() },
      ]);

      const visibilityMinutes = 0;
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      // 1 second = ~0.0167 minutes, which is > 0, so task is visible
      // Zero visibility only hides at exactly 0 minutes elapsed
      expect(visible).toBe(true);
    });

    it('should handle very large visibility windows', () => {
      const now = new Date('2026-01-05T12:00:00.000Z');
      const sessionTime = new Date('2026-01-03T12:00:00.000Z'); // 2 days ago
      
      const todo = createTodoWithWorkSessions([
        { date: '2026-01-03', timestamp: sessionTime.toISOString() },
      ]);

      const visibilityMinutes = 60 * 24 * 3; // 3 days in minutes
      const visible = shouldBeVisible(todo, now, visibilityMinutes);

      expect(visible).toBe(false); // Should be hidden (2 days < 3 days)
    });
  });
});
