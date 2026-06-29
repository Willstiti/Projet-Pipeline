import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const baseTask: Task = {
  id: 42,
  title: 'Tâche initiale',
  description: 'Description initiale',
  completed: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
  it('renders task information and toggles completion', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={baseTask}
        onToggle={onToggle}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Tâche initiale')).toBeInTheDocument();
    expect(screen.getByText('Description initiale')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(42);
  });

  it('edits and saves with trimmed values', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={baseTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={onEdit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    const titleInput = screen.getByLabelText('Modifier le titre');
    const descriptionInput = screen.getByLabelText('Modifier la description');

    await user.clear(titleInput);
    await user.type(titleInput, '  Nouveau titre  ');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, '  Nouvelle description  ');

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onEdit).toHaveBeenCalledWith(42, {
      title: 'Nouveau titre',
      description: 'Nouvelle description',
    });
    expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
  });

  it('does not save when edited title is empty', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={baseTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={onEdit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    const titleInput = screen.getByLabelText('Modifier le titre');
    await user.clear(titleInput);
    await user.type(titleInput, '   ');

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onEdit).not.toHaveBeenCalled();
  });

  it('requires confirmation before deleting', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={baseTask}
        onToggle={vi.fn()}
        onDelete={onDelete}
        onEdit={vi.fn()}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Supprimer' });

    await user.click(deleteButton);
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  it('cancels edit and restores initial values', async () => {
    const user = userEvent.setup();

    render(
      <TaskItem
        task={baseTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    const titleInput = screen.getByLabelText('Modifier le titre');
    await user.clear(titleInput);
    await user.type(titleInput, 'Titre temporaire');

    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
    expect(screen.getByText('Tâche initiale')).toBeInTheDocument();
  });
});
