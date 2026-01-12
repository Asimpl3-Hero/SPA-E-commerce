import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Alert } from '../alert';

describe('Alert Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders alert when isOpen is true', () => {
    render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Operation completed successfully"
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <Alert
        isOpen={false}
        type="success"
        title="Success"
        message="Operation completed successfully"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders success type alert with correct icon', () => {
    render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Test"
      />
    );

    const alert = screen.getByText('Success').closest('.alert');
    expect(alert).toHaveClass('alert-success');
  });

  test('renders error type alert with correct icon', () => {
    render(
      <Alert
        isOpen={true}
        type="error"
        title="Error"
        message="Test"
      />
    );

    const alert = screen.getByText('Error').closest('.alert');
    expect(alert).toHaveClass('alert-error');
  });

  test('renders warning type alert with correct icon', () => {
    render(
      <Alert
        isOpen={true}
        type="warning"
        title="Warning"
        message="Test"
      />
    );

    const alert = screen.getByText('Warning').closest('.alert');
    expect(alert).toHaveClass('alert-warning');
  });

  test('renders info type alert with correct icon', () => {
    render(
      <Alert
        isOpen={true}
        type="info"
        title="Info"
        message="Test"
      />
    );

    const alert = screen.getByText('Info').closest('.alert');
    expect(alert).toHaveClass('alert-info');
  });

  test('calls onClose when close button is clicked', async () => {
    const handleClose = jest.fn();

    render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Test"
        onClose={handleClose}
        autoClose={false}
      />
    );

    const closeButton = screen.getByLabelText('Close');

    act(() => {
      fireEvent.click(closeButton);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  test('auto-closes after duration when autoClose is true', async () => {
    const handleClose = jest.fn();

    render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Test"
        onClose={handleClose}
        autoClose={true}
        duration={1000}
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  test('does not auto-close when autoClose is false', () => {
    const handleClose = jest.fn();

    render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Test"
        onClose={handleClose}
        autoClose={false}
      />
    );

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  test('renders without title', () => {
    render(
      <Alert
        isOpen={true}
        type="info"
        message="Just a message"
      />
    );

    expect(screen.getByText('Just a message')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('renders without message', () => {
    render(
      <Alert
        isOpen={true}
        type="info"
        title="Just a title"
      />
    );

    expect(screen.getByText('Just a title')).toBeInTheDocument();
  });

  test('applies closing class when closing', async () => {
    const handleClose = jest.fn();

    render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Test"
        onClose={handleClose}
        autoClose={false}
      />
    );

    const closeButton = screen.getByLabelText('Close');

    act(() => {
      fireEvent.click(closeButton);
    });

    const overlay = screen.getByText('Success').closest('.alert-overlay');
    expect(overlay).toHaveClass('closing');
  });

  test('clears timeout on unmount', () => {
    const { unmount } = render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Test"
        autoClose={true}
        duration={5000}
      />
    );

    unmount();

    // If timeout wasn't cleared, this would cause issues
    act(() => {
      jest.advanceTimersByTime(6000);
    });
  });

  test('uses default duration of 20000ms when not specified', () => {
    const handleClose = jest.fn();

    render(
      <Alert
        isOpen={true}
        type="success"
        title="Success"
        message="Test"
        onClose={handleClose}
        autoClose={true}
      />
    );

    act(() => {
      jest.advanceTimersByTime(19999);
    });

    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
