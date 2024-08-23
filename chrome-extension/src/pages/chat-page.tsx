import React from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import { useNavigate, Routes, Route, Outlet } from 'react-router-dom';
import ChatWithPage from './chat-with-page';
import GroupedChat from './chat-grouped-page';
import ChatWithSelectionPage from './chat-with-selection-page';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();

  // Function to handle tab changes
  const handleTabChange = (key: React.Key) => {
    if (key === 'This Page') {
      navigate('/chat/this-page');
    } else if (key === 'Selected Page') {
      navigate('/chat/selected-page');
    } else if (key === 'Grouped Pages') {
      navigate('/chat/grouped-pages');
    }
  };

  return (
    <div className="p-2 h-lvh w-lvw flex flex-col items-center text-slate-50 bg-[#3B3B3B] overflow-y-auto">
        <Tabs aria-label="Type" size="sm" onSelectionChange={handleTabChange}>
          <Tab key="Selected Page" title="Selection">
            
          </Tab>
          <Tab key="This Page" title="This Page" />
          <Tab key="Grouped Pages" title="Grouped Pages" />
        </Tabs>
      {/* Define nested routes */}
      <Routes>
        <Route path="this-page" element={<ChatWithPage />} />
        <Route path="selected-page" element={<ChatWithSelectionPage />} />
        <Route path="grouped-pages" element={<GroupedChat />} />
      </Routes>
      {/* Outlet for nested route components */}
      <Outlet />
    </div>
  );
};

export default ChatPage;
