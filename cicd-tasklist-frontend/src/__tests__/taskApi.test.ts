import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			})
		);

		const tasks = await getTasks();
		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('/api/tasks');
	});

	it('createTask sends POST and returns created task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			})
		);

		const payload = { title: 'Nouvelle tâche', description: 'Description' };
		const task = await createTask(payload);

		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
	});

	it('updateTask sends PUT and returns updated task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ ...mockTask, completed: true }),
			})
		);

		const task = await updateTask(1, { completed: true });

		expect(task).toEqual({ ...mockTask, completed: true });
		expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ completed: true }),
		});
	});

	it('deleteTask sends DELETE', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
			})
		);

		await expect(deleteTask(1)).resolves.toBeUndefined();
		expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
			method: 'DELETE',
		});
	});

	it('throws when API returns non-ok response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve('Server error'),
			})
		);

		await expect(getTasks()).rejects.toThrow('HTTP 500: Server error');
	});
});
