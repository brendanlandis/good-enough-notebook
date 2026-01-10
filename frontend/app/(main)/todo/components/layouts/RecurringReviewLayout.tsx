"use client";

import TodoItem from "../TodoItem";
import type { LayoutRendererProps } from "./types";
import type { RecurrenceType, Project } from "@/app/types/index";

// Helper function to get human-readable label for recurrence type
function getRecurrenceTypeLabel(recurrenceType: RecurrenceType, todos: any[]): string {
  switch (recurrenceType) {
    case "daily":
      return "every day";
    case "every x days":
      return "every x days";
    case "weekly":
      return "weekly";
    case "biweekly":
      return "biweekly";
    case "monthly date":
      return "monthly (by date)";
    case "monthly day":
      return "monthly (by day)";
    case "annually":
      return "annually";
    case "full moon":
      return "full moon";
    case "new moon":
      return "new moon";
    case "every season":
      return "every season";
    case "winter solstice":
      return "winter solstice";
    case "spring equinox":
      return "spring equinox";
    case "summer solstice":
      return "summer solstice";
    case "autumn equinox":
      return "autumn equinox";
    default:
      return recurrenceType;
  }
}

export default function RecurringReviewLayout({
  transformedData,
  onComplete,
  onEdit,
  onDelete,
  onWorkSession,
  onRemoveWorkSession,
  onSkipRecurring,
  onEditProject,
}: LayoutRendererProps) {
  const { recurringReviewSections, recurringReviewIncidentals } = transformedData;

  // Check if there are any recurring tasks at all (either in sections or incidentals)
  const hasSections = recurringReviewSections && recurringReviewSections.size > 0;
  const hasIncidentals = recurringReviewIncidentals && recurringReviewIncidentals.size > 0;
  
  if (!hasSections && !hasIncidentals) {
    return <p>no recurring tasks</p>;
  }

  // Define the order of recurrence types
  const recurrenceTypeOrder: RecurrenceType[] = [
    "daily",
    "every x days",
    "weekly",
    "biweekly",
    "monthly date",
    "monthly day",
    "annually",
    "full moon",
    "new moon",
    "every season",
    "winter solstice",
    "spring equinox",
    "summer solstice",
    "autumn equinox",
  ];

  return (
    <div className="todos-container">
      {recurrenceTypeOrder.map((recurrenceType) => {
        const sections = recurringReviewSections?.get(recurrenceType);
        const incidentals = recurringReviewIncidentals?.get(recurrenceType);

        if (!sections && (!incidentals || incidentals.length === 0)) {
          return null;
        }

        // Get all todos to determine the label (for "every x days")
        const allTodos: any[] = [];
        sections?.forEach((section) => {
          if ("documentId" in section) {
            allTodos.push(...(section.todos || []));
          } else {
            allTodos.push(...section.todos);
          }
        });
        if (incidentals) {
          allTodos.push(...incidentals);
        }

        const label = getRecurrenceTypeLabel(recurrenceType, allTodos);

        return (
          <div key={recurrenceType} className="todo-section">
            <h3>{label}</h3>
            
            {/* Render projects and categories */}
            {sections && sections.map((section, index) => {
              const isProject = "documentId" in section;
              const sectionTitle = isProject ? (section as Project).title : section.title;
              const todos = isProject ? (section as Project).todos || [] : section.todos;
              
              return (
                <div key={isProject ? (section as Project).documentId : index}>
                  <h4>{sectionTitle}</h4>
                  <ul className="todos-list">
                    {todos.map((todo) => (
                      <TodoItem
                        key={todo.documentId}
                        todo={todo}
                        onComplete={onComplete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onWorkSession={onWorkSession}
                        onRemoveWorkSession={onRemoveWorkSession}
                        onSkipRecurring={onSkipRecurring}
                        showProjectName={false}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
            
            {/* Render incidentals */}
            {incidentals && incidentals.length > 0 && (
              <div>
                <h4>incidentals</h4>
                <ul className="todos-list">
                  {incidentals.map((todo) => (
                    <TodoItem
                      key={todo.documentId}
                      todo={todo}
                      onComplete={onComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onWorkSession={onWorkSession}
                      onRemoveWorkSession={onRemoveWorkSession}
                      onSkipRecurring={onSkipRecurring}
                      showProjectName={false}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
