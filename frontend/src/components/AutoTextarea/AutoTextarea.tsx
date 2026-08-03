import { useRef, useEffect, type TextareaHTMLAttributes } from 'react';
import styles from './AutoTextarea.module.css';

interface AutoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** When true, the textarea resets its height on every value change */
  autoResize?: boolean;
}

const AutoTextarea: React.FC<AutoTextareaProps> = ({
  autoResize = true,
  className = '',
  rows = 2,
  ...props
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoResize || !ref.current) return;
    const el = ref.current;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [autoResize, props.value]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (!autoResize) return;
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    props.onInput?.(e);
  };

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${styles.textarea} ${className}`}
      onInput={handleInput}
      {...props}
    />
  );
};

export default AutoTextarea;