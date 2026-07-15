import { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface UseConfirmReturn {
  confirm: (message: string, title?: string) => Promise<boolean>;
  ConfirmDialogComponent: React.FC;
}

export const useConfirm = (): UseConfirmReturn => {
  const [state, setState] = useState<{
    message: string;
    title?: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ message, title, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  const ConfirmDialogComponent: React.FC = () => (
    <ConfirmDialog
      open={state !== null}
      message={state?.message || ''}
      title={state?.title}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogComponent };
};