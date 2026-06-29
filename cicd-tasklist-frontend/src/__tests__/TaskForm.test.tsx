import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
  it('shows validation error when title is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values and clears fields in create mode', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm onSubmit={onSubmit} />);

    const titleInput = screen.getByLabelText('Titre');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(titleInput, '  Nouvelle tâche  ');
    await user.type(descriptionInput, '  Description test  ');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Nouvelle tâche',
      description: 'Description test',
    });
    expect(titleInput).toHaveValue('');
    expect(descriptionInput).toHaveValue('');
  });

  it('keeps values in edit mode and calls cancel handler', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskForm
        onSubmit={onSubmit}
        mode="edit"
        initialValues={{ title: 'Titre existant', description: 'Desc existante' }}
        onCancel={onCancel}
      />
    );

    const titleInput = screen.getByLabelText('Titre');
    expect(screen.getByRole('heading', { name: 'Modifier la tâche' })).toBeInTheDocument();

    await user.clear(titleInput);
    await user.type(titleInput, 'Titre modifié');
    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Titre modifié',
      description: 'Desc existante',
    });
    expect(titleInput).toHaveValue('Titre modifié');

    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
