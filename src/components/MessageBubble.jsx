import { memo } from 'react'
import FeedbackCard from './FeedbackCard'

// memo prevents re-render during streaming — only re-renders if this message changes
const MessageBubble = memo(function MessageBubble({ message }) {
  const isAI = message.sender === 'ai'

  return (
    <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} gap-1`}>
      {isAI && message.is_question && (
        <p className="text-xs text-gray-600 ml-1">Question {message.question_num} of 5</p>
      )}

      <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
        isAI ? 'bg-gray-900 text-gray-100' : 'bg-gray-800 text-white'
      }`}>
        {message.content}
      </div>

      {message.feedback && (
        <div className="w-full max-w-[80%]">
          <FeedbackCard feedback={message.feedback} />
        </div>
      )}
    </div>
  )
})

export default MessageBubble
