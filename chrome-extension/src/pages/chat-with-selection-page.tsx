import { useEffect, useRef, useState } from 'react';
import AppIcon from '../components/AppIcon';
import { Button } from '@nextui-org/react';
import { getUrl } from '../utils';
const ChatWithSelectionPage = () => {
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [contentId, setContentId] = useState('');

  const [messages, setMessages] = useState([
    { text: 'Welcome to TL;DR AI, Select text and click load from selection.', sender: 'other' }
  ]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [, setUserName] = useState<string | null>(null);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [loadingClipboard, setLoadingClipboard] = useState(false);
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

  const handleCopySelectedText = () => {
    setLoadingSelection(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id || 0 },
          func: () => {
            const selectedText = window.getSelection()?.toString();
            return selectedText;
          }
        },
        async (results) => {
          const selectedText = results[0].result;
          if (selectedText) {
            if (true) {
              const response = await fetch(getUrl('/api/content'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content_data: selectedText,
                  user_id: userId
                })
              });
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }

              const data = await response.json();
              setContentId(data.content_id);
              setLoadingSelection(false);
            }
          }
        }
      );
    });
  };

  const handlePaste = async () => {
    setLoadingClipboard(true);
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        //const hash = generateHash(text);
        if (true) {
          //!contentHashes.has(hash)) {
          const response = await fetch(getUrl('/api/content'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content_id: contentId,
              content_data: text,
              user_id: userId
            })
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const data = await response.json();
          setContentId(data.content_id);
          setLoadingClipboard(false);
        }
      } else {
        console.log('Clipboard API not supported');
        setLoadingClipboard(false);
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err);
      setLoadingClipboard(false);
    }
  };

  const handleReset = async () => {
    setContentId('');
    setMessages([{ text: 'Welcome to TL;DR AI. You can ask anything about this page.', sender: 'other' }]);
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

  useEffect(() => {
    // Retrieve user_id and name from local storage
    const storedUserId = localStorage.getItem('user_id');
    const storedUserName = localStorage.getItem('name');
    setUserId(storedUserId);
    setUserName(storedUserName);

    const checkSelection = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        try {
          if (tabs && tabs.length > 0) {
            if (tabs[0].url?.includes('chrome://')) return;

            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id || 0 },
                func: () => {
                  return window.getSelection()?.toString();
                }
              },
              (results) => {
                if (results && results.length > 0 && results[0].result !== '') {
                  setIsTextSelected(true);
                } else {
                  setIsTextSelected(false);
                }
              }
            );
          } else {
            console.error('No active tab found.');
          }
        } catch (e) {
          console.error(e);
        }
      });
    };

    const interval = setInterval(() => {
      checkSelection();
    }, 500);

    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <div className="p-2 h-lvh w-lvw flex flex-col items-center text-slate-50 bg-[#3B3B3B] overflow-y-auto">
        <div className="border-b-1 border-gray-200 px-2 pt-2 pb-2 mb-4 sm:mb-0 w-full max-h-96 overflow-y-auto">
          <div className="space-y-2 w-full">
            <div>
              Select / highlight any text content to discuss with <b>TL;DR</b>.<br />
              <span className="text-xs">
                For PDF's copy content to clipboard and click load from clipboard
              </span>
            </div>
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
          <div className="flex justify-center gap-12 px-4 py-4">
            <Button
              isLoading={loadingSelection}
              type="button"
              className={`inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white ${isTextSelected ? 'bg-green-500 hover:bg-green-400' : 'bg-gray-400 cursor-not-allowed'}`}
              onClick={handleCopySelectedText}
              disabled={!isTextSelected}
            >
              Load from Selection
            </Button>
            <Button
              isLoading={loadingClipboard}
              type="button"
              color="warning"
              //className={`inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-yellow-500 hover:bg-yellow-400`}
              onClick={handlePaste}
            >
              Load from Clipboard
            </Button>
            <Button
              type="button"
              color="primary"
              //className={`inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out`}
              onClick={handleReset}
            >
              Clear Data
            </Button>
          </div>
          <div className="border-t-1 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
            <div className="relative grid grid-cols-[1fr_auto_auto_auto] gap-4">
              <input
                type="text"
                placeholder="Ask your question here"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-12 bg-gray-200 rounded-md py-3"
              />
              <Button
                type="button"
                color="success"
                size="lg"
                //className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
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
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWithSelectionPage;
