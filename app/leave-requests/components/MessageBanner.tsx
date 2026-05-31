'use client'

import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, X } from 'lucide-react'

interface Props {
  message?: string
  error?: string
  onCloseMessage?: () => void
  onCloseError?: () => void
}

export function MessageBanner({ message, error, onCloseMessage, onCloseError }: Props) {
  return (
    <>
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
            {onCloseMessage && (
              <button onClick={onCloseMessage} className="text-green-500 hover:text-green-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center"
          >
            <span>{error}</span>
            {onCloseError && (
              <button onClick={onCloseError} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
