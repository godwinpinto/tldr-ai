import { useEffect, useRef, useState } from 'react';
import AppIcon from '../components/AppIcon';
import DeleteIcon from '../components/DeleteIcon';
import { getUrl } from '../utils';

const GroupedChat = () => {
  const [checkboxes, setCheckboxes] = useState<{ id: number; value: string }[]>([]);
  const [selectedContentIds, setSelectedContentIds] = useState<number[]>([]);

  const handleCheckboxChange = (id: number) => {
    setSelectedContentIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((contentId) => contentId !== id)
        : [...prevSelected, id]
    );
  };

  const [messages, setMessages] = useState([
    { text: 'Welcome to TL;DR AI. Choose from the list of pages to ask question', sender: 'other' }
  ]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  // const [, setUserName] = useState<string | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() !== '') {
      // Add the user message to the chat
      const userMessage = { text: inputValue, sender: 'self' };
      setMessages([...messages, userMessage]);
      setInputValue('');
      scrollToBottom();

      // Call the API with the message content
      try {
        const response = await fetch(getUrl('/api/message-by-user-id'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_ids: selectedContentIds,
            user_id: userId,
            question_data: inputValue
          })
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const botResponse = data.bot_response;

        if (botResponse) {
          // Add the bot response to the chat
          setMessages([...messages, userMessage, { text: botResponse, sender: 'other' }]);
          scrollToBottom();
        }
      } catch (error) {
        console.error('Failed to fetch bot response:', error);
      }
    }
  };

  const handleDeleteCheckbox = (id: number) => {
    setCheckboxes(checkboxes.filter((checkbox) => checkbox.id !== id));
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    setUserId(storedUserId);

    const fetchCheckboxes = async () => {
      try {
        const response = await fetch(getUrl('/api/content?user_id=' + storedUserId)); // Replace with your API endpoint
        const data = await response.json();
        // Map API response to state format
        const mappedData = data.map((item: any) => ({
          id: item.content_id,
          value: item.content_prefix.trim() || 'Untitled' // Default value if content_prefix is empty
        }));
        setCheckboxes(mappedData);
      } catch (error) {
        console.error('Error fetching checkboxes:', error);
      }
    };

    fetchCheckboxes();

    // const prefilledCheckboxes = [
    //     { id: 1, value: 'Pizza' },
    //     { id: 2, value: 'Sushi' },
    //     { id: 3, value: 'Burger' },
    //     { id: 4, value: 'Pasta' },
    //     { id: 5, value: 'Tacos' }
    //   ];
    //   setCheckboxes(prefilledCheckboxes);
  }, []);
  return (
    <>
      <div className="p-2 h-lvh w-lvw flex flex-col items-center text-slate-50 bg-[#3B3B3B] overflow-y-auto">
        <div className="border-b-1 border-gray-200 px-2 pt-2 pb-2 mb-4 sm:mb-0 w-full max-h-96 overflow-y-auto">
          <div className="space-y-2 w-full">
            <div>AI Bookmarked Pages</div>
            {checkboxes.map((checkbox) => (
              <div
                key={checkbox.id}
                className="flex items-center justify-between bg-gray-700 p-2 rounded-md w-full"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedContentIds.includes(checkbox.id)}
                    onChange={() => handleCheckboxChange(checkbox.id)}
                  />
                  {checkbox.value}
                </label>
                <button
                  type="button"
                  className="text-red-500"
                  onClick={() => handleDeleteCheckbox(checkbox.id)}
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4 flex-grow w-full p-2 sm:p-6 justify-between flex flex-col overflow-y-auto">
          <div
            id="messages"
            className="flex-grow flex flex-col space-y-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${message.sender === 'self' ? 'justify-end' : ''}`}
              >
                <div className={`flex items-end ${message.sender === 'self' ? 'justify-end' : ''}`}>
                  {message.sender !== 'self' && <AppIcon height={40} width={40} />}
                  <div
                    className={`flex flex-col space-y-2 text-sm max-w-full mx-2 order-${message.sender === 'self' ? '1' : '2'} items-${message.sender === 'self' ? 'end' : 'start'}`}
                  >
                    <div>
                      <span
                        className={`px-4 py-2 rounded-lg inline-block ${message.sender === 'self' ? 'rounded-br-none bg-blue-600 text-white' : 'rounded-bl-none bg-gray-300 text-gray-600'}`}
                      >
                        {message.text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="pb-10" />
          </div>

          <div className="border-t-1 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
            <div className="relative grid grid-cols-[1fr_auto_auto_auto] gap-4">
              <input
                type="text"
                placeholder="Ask your question here!"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-12 bg-gray-200 rounded-md py-3"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
                onClick={handleSendMessage}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6 ml-2 transform rotate-90"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupedChat;
