import React, { useState } from 'react';
import { FaPaperPlane, FaSearch, FaPhoneAlt, FaVideo, FaCircle, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import MobileMenu from '../components/MobileMenu';
import UserHeader from '../components/UserHeader';

const Messages = () => {
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState(1);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State for conversations (Synced with Mutual Interests)
  const [conversations, setConversations] = useState(() => {
    const savedInt = JSON.parse(localStorage.getItem('userInterests') || "{}");
    const mutuals = savedInt.mutual || [];

    // Merge mutuals with some initial mock data if needed for a richer feel
    const mockConvs = [
      { id: 101, name: 'Ankita Singh', age: 24, label: 'Mutual Match', lastMessage: 'Interested in connecting?', time: '2m', unread: 2, image: 'https://randomuser.me/api/portraits/women/10.jpg', online: true },
    ];

    // Return unique list by ID
    const combined = [...mutuals, ...mockConvs];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  });

  // Filter Conversations
  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mock Messages Data
  const [messages, setMessages] = useState({
    1: [
      { id: 1, fromMe: false, text: 'Hi! I saw your profile and found it interesting.', time: '10:00 AM' },
      { id: 2, fromMe: true, text: 'Hello Priya, thanks! I liked your profile too.', time: '10:05 AM' },
      { id: 3, fromMe: false, text: 'Great! What do you do for work?', time: '10:10 AM' },
      { id: 4, fromMe: true, text: 'I am a Software Engineer at Google. What about you?', time: '10:12 AM' },
      { id: 5, fromMe: false, text: 'That sounds great! 😊', time: '10:15 AM' },
    ],
    2: [
      { id: 1, fromMe: false, text: 'Hi, are you based in Mumbai?', time: 'Yesterday' },
    ],
    3: [],
    4: []
  });

  const activeUser = conversations.find(c => c.id === activeChat) || conversations[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      fromMe: true,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages({
      ...messages,
      [activeChat]: [...(messages[activeChat] || []), newMsg]
    });
    setMessageText('');
  };

  const startCall = (type) => {
    alert(`${type} call with ${activeUser.name}... (Feature coming soon)`);
  };

  const handleReport = () => {
    navigate('/report-abuse', {
      state: {
        targetUserId: activeUser.id,
        targetUserName: activeUser.name
      }
    });
  };



  return (
    <div className="min-h-screen bg-brandBlue flex flex-col">

      {/* ===== MOBILE MENU ===== */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <UserHeader setMobileMenuOpen={setMobileMenuOpen} showBack={true} />

      {/* Main Messages Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex p-2 md:p-6 gap-2 md:gap-6 font-sans overflow-hidden">

          {/* Sidebar - Contact List */}
          <div className={`${showSidebar ? 'block' : 'hidden'
            } md:block w-full md:w-2/5 lg:w-1/3 bg-brandBlue rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200`}>

            {/* Sidebar Header with BRANDING */}
            <div className="bg-brandNavy p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brandOrange/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2 relative z-10">
                SarvVivah <span className="text-[10px] font-normal opacity-80 uppercase tracking-widest border border-white/30 px-1.5 py-0.5 rounded ml-1">Premium Chat</span>
              </h2>
              <p className="text-blue-100 text-xs opacity-90 relative z-10">Safe & Secure Matrimonial Messenger</p>

              <div className="mt-6 relative">
                <input
                  type="text"
                  placeholder="Search Matches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-blue-100 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brandOrange/50 border border-white/10 transition backdrop-blur-sm"
                />
                <FaSearch className="absolute left-3.5 top-3.5 text-blue-100" />
              </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveChat(conv.id);
                      if (window.innerWidth < 768) setShowSidebar(false);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border border-transparent
                  ${activeChat === conv.id
                        ? 'bg-orange-50 border-orange-200 shadow-sm transform scale-[1.02]'
                        : 'hover:bg-gray-50 hover:border-gray-100'}
                `}
                  >
                    <div className="relative">
                      <img src={conv.image} alt={conv.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                      {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className={`font-semibold truncate ${activeChat === conv.id ? 'text-orange-900' : 'text-brandNavy'}`}>{conv.name}</h3>
                        <span className="text-xs text-gray-400">{conv.time}</span>
                      </div>
                      <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-brandNavy' : 'text-gray-500'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.unread > 0 && (
                      <div className="bg-gradient-to-r from-brandOrange to-orange-700 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No users found.
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`${!showSidebar ? 'flex' : 'hidden'
            } md:flex flex-1 bg-brandBlue rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200 relative`}>

            {/* Chat Header */}
            <div className="px-4 md:px-6 py-4 bg-brandBlue border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden text-gray-500 hover:text-brandOrange p-2 -ml-2 transition"
                >
                  <FaArrowLeft />
                </button>
                <div className="relative cursor-pointer hover:opacity-90 transition">
                  <img src={activeUser.image} alt={activeUser.name} className="w-11 h-11 rounded-full object-cover border-2 border-orange-100" />
                  {activeUser.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>
                <div>
                  <h2 className="font-bold text-brandNavy text-lg leading-tight">{activeUser.name}</h2>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    {activeUser.online ? <><FaCircle className="w-1.5 h-1.5" /> Online Now</> : 'Last seen recently'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 md:gap-3 text-gray-500">
                <button onClick={handleReport} className="hover:text-red-600 hover:bg-red-50 bg-red-50 text-red-500 px-3 md:px-4 py-2 md:py-3 rounded-full transition-all shadow-sm border border-red-200 flex items-center gap-2 font-medium text-xs md:text-sm" title="Report User">
                  <FaExclamationTriangle className="text-sm" />
                  <span className="hidden sm:inline">Report</span>
                </button>
                <button onClick={() => startCall('Voice')} className="hover:text-brandOrange hover:bg-orange-50 bg-gray-50 p-2 md:p-3 rounded-full transition-all shadow-sm" title="Voice Call">
                  <FaPhoneAlt />
                </button>
                <button onClick={() => startCall('Video')} className="hover:text-brandOrange hover:bg-orange-50 bg-gray-50 p-2 md:p-3 rounded-full transition-all shadow-sm" title="Video Call">
                  <FaVideo />
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-brandBlue/90 relative scroll-smooth">
              {/* Subtle Branding Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                <h1 className="text-9xl font-bold text-gray-500 rotate-[-15deg]">SarvVivah</h1>
              </div>

              {(messages[activeChat] || []).length > 0 ? (
                (messages[activeChat]).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} relative z-10`}>
                    <div className={`max-w-[65%] p-4 rounded-2xl shadow-sm text-sm relative group transition-all hover:shadow-md
                   ${msg.fromMe
                        ? 'bg-gradient-to-br from-brandOrange to-orange-700 text-white rounded-tr-none'
                        : 'bg-brandBlue text-brandNavy border border-gray-200 rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed text-[15px]">{msg.text}</p>
                      <p className={`text-[10px] mt-1.5 text-right opacity-70 font-medium tracking-wide ${msg.fromMe ? 'text-orange-100' : 'text-gray-400'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaPaperPlane className="text-3xl text-gray-300 ml-[-4px] mt-[4px]" />
                  </div>
                  <p className="text-gray-500 font-medium">No messages yet.</p>
                  <p className="text-xs">Start the conversation with {activeUser.name}!</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-5 bg-brandBlue border-t border-gray-100 z-10">
              <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-orange-200 transition-all shadow-inner">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md transform
                  ${messageText.trim()
                      ? 'bg-gradient-to-r from-brandOrange to-orange-700 text-white hover:scale-105 hover:shadow-lg cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
                >
                  <FaPaperPlane className="text-sm ml-[-2px] mt-[2px]" />
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
