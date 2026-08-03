import { useConfirm } from '../../hooks/useConfirm';
import styles from './DeleteButton.module.css';

interface DeleteButtonProps {
  itemName: string;
  onDelete: () => Promise<void> | void;
  label?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ itemName, onDelete, label = '🗑️' }) => {
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handleClick = async () => {
    if (await confirm(`Удалить ${itemName}? Это действие нельзя отменить.`)) {
      await onDelete();
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.deleteButton}
        aria-label="Удалить"
        onClick={handleClick}
      >
        {label}
      </button>
      <ConfirmDialogComponent />
    </>
  );
};

export default DeleteButton;