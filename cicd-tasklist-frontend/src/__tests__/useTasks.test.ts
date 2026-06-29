import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';

vi.mock('../api/taskApi', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const mockedTaskApi = vi.mocked(taskApi);

const taskA = {
  id: 1,
  title: 'Task A',
  description: null,
  completed: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

const taskB = {
  id: 2,
  title: 'Task B',
  description: 'desc',
  completed: true,
  createdAt: '2026-01-16T10:00:00Z',
  updatedAt: '2026-01-16T10:00:00Z',
};

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads tasks on mount', async () => {
    mockedTaskApi.getTasks.mockResolvedValue([taskA, taskB]);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual([taskA, taskB]);
    expect(result.current.error).toBeNull();
    expect(mockedTaskApi.getTasks).toHaveBeenCalledTimes(1);
  });

  it('sets error when loading fails', async () => {
    mockedTaskApi.getTasks.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toBe('boom');
  });

  it('adds a new task at the top', async () => {
    mockedTaskApi.getTasks.mockResolvedValue([taskA]);
    mockedTaskApi.createTask.mockResolvedValue(taskB);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTask({ title: 'Task B', description: 'desc' });
    });

    expect(result.current.tasks).toEqual([taskB, taskA]);
    expect(mockedTaskApi.createTask).toHaveBeenCalledWith({ title: 'Task B', description: 'desc' });
  });

  it('edits an existing task', async () => {
    mockedTaskApi.getTasks.mockResolvedValue([taskA]);
    mockedTaskApi.updateTask.mockResolvedValue({ ...taskA, title: 'Task A modifiee' });

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.editTask(1, { title: 'Task A modifiee' });
    });

    expect(result.current.tasks[0].title).toBe('Task A modifiee');
    expect(mockedTaskApi.updateTask).toHaveBeenCalledWith(1, { title: 'Task A modifiee' });
  });

  it('removes a task', async () => {
    mockedTaskApi.getTasks.mockResolvedValue([taskA, taskB]);
    mockedTaskApi.deleteTask.mockResolvedValue();

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeTask(1);
    });

    expect(result.current.tasks).toEqual([taskB]);
    expect(mockedTaskApi.deleteTask).toHaveBeenCalledWith(1);
  });

  it('toggles completion state for a task', async () => {
    mockedTaskApi.getTasks.mockResolvedValue([taskA]);
    mockedTaskApi.updateTask.mockResolvedValue({ ...taskA, completed: true });

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleComplete(1);
    });

    expect(mockedTaskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('does nothing when toggling unknown task', async () => {
    mockedTaskApi.getTasks.mockResolvedValue([taskA]);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleComplete(999);
    });

    expect(mockedTaskApi.updateTask).not.toHaveBeenCalled();
    expect(result.current.tasks).toEqual([taskA]);
  });
});
