import React, { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-red-700 font-medium">エラーが発生しました</p>
          <p className="text-red-600 text-sm mt-1 break-all select-text">{message}</p>
        </div>
        <button
          onClick={handleCopy}
          className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
          title="エラーメッセージをコピー"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ClipboardDocumentIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage; 