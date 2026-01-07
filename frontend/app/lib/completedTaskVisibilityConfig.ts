/**
 * Completed task visibility configuration
 * Fetches completed task visibility duration from Strapi system settings
 * 
 * Determines how long completed tasks remain visible in the main list
 * before disappearing (they always remain in the "done" view).
 */

const DEFAULT_COMPLETED_TASK_VISIBILITY_MINUTES = 15;

// Cache for the visibility duration value
let cachedVisibilityMinutes: number | null = null;

/**
 * Get the completed task visibility duration in minutes
 * Priority: Strapi system setting > environment variable > default (15)
 * @returns Minutes that completed tasks remain visible in main list
 */
export function getCompletedTaskVisibilityMinutes(): number {
  // Return cached value if available
  if (cachedVisibilityMinutes !== null) {
    return cachedVisibilityMinutes;
  }
  
  // Fallback to environment variable or default
  const envValue = process.env.NEXT_PUBLIC_COMPLETED_TASK_VISIBILITY_MINUTES;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  
  return DEFAULT_COMPLETED_TASK_VISIBILITY_MINUTES;
}

/**
 * Set the cached visibility duration value
 * This is called after fetching from Strapi
 * @param minutes - Minutes that completed tasks remain visible
 */
export function setCachedVisibilityMinutes(minutes: number): void {
  if (minutes >= 0) {
    cachedVisibilityMinutes = minutes;
  }
}

/**
 * Fetch completed task visibility duration from Strapi system settings
 * @returns Promise with minutes number or null
 */
export async function fetchVisibilityMinutesFromStrapi(): Promise<number | null> {
  try {
    const response = await fetch('/api/system-settings?title=completedTaskVisibilityMinutes');
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.success && data.value) {
      const minutes = parseInt(data.value, 10);
      if (!isNaN(minutes) && minutes >= 0) {
        setCachedVisibilityMinutes(minutes);
        return minutes;
      }
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch completed task visibility minutes from Strapi:', e);
    return null;
  }
}

/**
 * Save completed task visibility duration to Strapi system settings
 * @param minutes - Minutes that completed tasks remain visible
 * @returns Promise with success boolean
 */
export async function saveVisibilityMinutesToStrapi(minutes: number): Promise<boolean> {
  if (minutes < 0) {
    console.error('Invalid visibility minutes:', minutes);
    return false;
  }
  
  try {
    const response = await fetch('/api/system-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'completedTaskVisibilityMinutes',
        value: minutes.toString(),
      }),
    });
    
    if (response.ok) {
      setCachedVisibilityMinutes(minutes);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to save visibility minutes to Strapi:', e);
    return false;
  }
}

