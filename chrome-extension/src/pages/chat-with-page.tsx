import AppIcon from '../components/AppIcon';
import { useState, useEffect, useRef } from 'react';
//import { SHA256 } from 'crypto-ts';
import { getUrl } from '../utils';
import { Button } from '@nextui-org/react';
import TurndownService from 'turndown';
import { convert } from 'html-to-text';

function ChatWithPage() {
  const [messages, setMessages] = useState([
    { text: 'Welcome to TL;DR AI. You can ask anything about this page', sender: 'other' }
  ]);

  const [inputValue, setInputValue] = useState('');
  //  const [contentHashes, setContentHashes] = useState(new Set<string>());
  const [userId, setUserId] = useState<string | null>(null);
  const [, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentId, setContentId] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  useEffect(() => {
    // Retrieve user_id and name from local storage
    const storedUserId = localStorage.getItem('user_id');
    const storedUserName = localStorage.getItem('name');
    setUserId(storedUserId);
    setUserName(storedUserName);
  }, []);

  const turndownService = new TurndownService();

  turndownService.addRule('removeScripts', {
    filter: ['script'],
    replacement: () => ''
  });

  // Remove inline event handlers (like onclick, onmouseover, etc.)
  turndownService.addRule('removeEventHandlers', {
    filter: (node) => {
      // Remove all nodes with attributes starting with "on"
      if (node.nodeType === 1) {
        // Ensure it's an element
        const attributes = node.attributes;
        for (let i = 0; i < attributes.length; i++) {
          if (attributes[i].name.startsWith('on')) {
            return true;
          }
        }
      }
      return false;
    },
    replacement: () => ''
  });

  //   const generateHash = (content: string) => {
  //     console.log(SHA256(content));
  //     console.log(SHA256(content).toString());
  //     return SHA256(content).toString();
  //   };

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
        const response = await fetch(getUrl('/api/message-by-content-id'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_id: contentId,
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

  const handleLoadPage = () => {
    setLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id || 0 },
          func: () => {
            const mainElement = document.querySelector('main'); // Select the <main> element
            return document.title+"  "+(mainElement ? mainElement.innerHTML : document.querySelector('body')?.innerHTML);
          }
        },
        async (results) => {
            console.log(results)
          const renderedHtml = results[0].result; // Store the rendered HTML
          //console.log('Rendered HTML content:', renderedHtml);

          if (renderedHtml) {
            const text = convert(renderedHtml, {
              wordwrap: 500,
              selectors: [
                { selector: 'a', format: 'skip' },
                { selector: 'img', format: 'skip' }
              ],
              preserveNewlines: true
            });

            ///const hash = generateHash(renderedHtml);
            console.log('Generated hash:', text);

            if (true) {
              // Modify this condition based on your logic
              console.log('Sending rendered HTML content to the backend');
              const response = await fetch(getUrl('/api/content-html'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content_data: text,
                  user_id: userId
                })
              });

              if (!response.ok) {
                throw new Error('Network response was not ok');
              }

              const data = await response.json();
              setContentId(data.content_id);
            }
          }
          setLoading(false);
        }
      );
    });
  };



  return (
    <>
      <div className="p-2 h-lvh w-lvw flex flex-col items-center text-slate-50 bg-[#3B3B3B] overflow-y-auto">
        <div className="flex-grow w-full p:2 sm:p-6 justify-between flex flex-col overflow-y-auto">
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
          <div className="flex justify-center gap-12 px-4 py-4">
            <Button type="button" color="warning" onClick={handleLoadPage} isLoading={loading}>
              Load Page
            </Button>
            
          </div>
          <div className="border-t-2 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
            <div className="relative grid grid-cols-[1fr_auto_auto_auto] gap-4">
              <input
                type="text"
                placeholder="Write your message!"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-12 bg-gray-200 rounded-md py-3"
              />
              <Button type="button" color="success" onClick={handleSendMessage} >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6 ml-2 transform rotate-90"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatWithPage;
