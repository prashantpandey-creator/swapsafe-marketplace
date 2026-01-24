import { useState } from 'react'
import { useParams } from 'react-router-dom'
import './Messages.css'

function Messages() {
    const { conversationId } = useParams()
    const [message, setMessage] = useState('')

    const conversations = [
        {
            id: '1',
            user: { name: 'Rahul Sharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
            product: { title: 'iPhone 14 Pro Max', image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=100' },
            lastMessage: 'Is the item still available?',
            timestamp: '2 hours ago',
            unread: true
        },
        {
            id: '2',
            user: { name: 'Priya Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
            product: { title: 'MacBook Pro 14"', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100' },
            lastMessage: 'Great, let\'s meet at the mall tomorrow',
            timestamp: '1 day ago',
            unread: false
        }
    ]

    const selectedConversation = conversations.find(c => c.id === conversationId) || conversations[0]

    const messages = [
        { id: 1, sender: 'other', text: 'Hi, is this item still available?', time: '10:30 AM' },
        { id: 2, sender: 'me', text: 'Yes, it is! Are you interested?', time: '10:32 AM' },
        { id: 3, sender: 'other', text: 'Yes! Can we meet tomorrow at Inorbit Mall?', time: '10:35 AM' },
        { id: 4, sender: 'me', text: 'Sure, let\'s meet at 3 PM. See you there!', time: '10:36 AM' },
    ]

    const handleSend = (e) => {
        e.preventDefault()
        if (message.trim()) {
            // Handle send message
            setMessage('')
        }
    }

    return (
        <div className="messages-page">
            <div className="messages-container">
                {/* Conversations List */}
                <aside className="conversations-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                    </div>
                    <div className="conversations-list">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`conversation-item ${conv.id === selectedConversation?.id ? 'active' : ''} ${conv.unread ? 'unread' : ''}`}
                            >
                                <img src={conv.user.avatar} alt={conv.user.name} className="avatar" />
                                <div className="conv-info">
                                    <div className="conv-header">
                                        <strong>{conv.user.name}</strong>
                                        <span className="conv-time">{conv.timestamp}</span>
                                    </div>
                                    <p className="conv-preview">{conv.lastMessage}</p>
                                    <p className="conv-product">
                                        <img src={conv.product.image} alt="" />
                                        {conv.product.title}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Chat Area */}
                <main className="chat-area">
                    <div className="chat-header">
                        <img src={selectedConversation?.user.avatar} alt="" className="avatar" />
                        <div className="chat-user-info">
                            <strong>{selectedConversation?.user.name}</strong>
                            <p>{selectedConversation?.product.title}</p>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.sender}`}>
                                <div className="message-bubble">
                                    <p>{msg.text}</p>
                                    <span className="message-time">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form className="chat-input" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="form-input"
                        />
                        <button type="submit" className="btn btn-primary" disabled={!message.trim()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </form>
                </main>
            </div>
        </div>
    )
}

export default Messages
