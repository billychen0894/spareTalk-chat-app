"use client";

import ChatAction from "@components/chats/ChatAction";
import ChatInput from "@components/chats/ChatInput";
import ChatMessages from "@components/chats/ChatMessages";
import { useChat } from "@hooks/useChat";

export default function Home() {
  const {
    isOffline,
    startChatSession,
    currChatRoom,
    chatMessages,
    chatContainerRef,
    socket,
    isError,
    disconnectChat,
    handleSendMessage,
    setNewMessage,
    startChatConnection,
    newMessage,
  } = useChat();

  return (
    <>
      {isOffline && (
        <div
          className={`fixed top-0 left-0 w-full bg-gray-400 bg-opacity-30 backdrop-blur-lg shadow-lg text-center ${isOffline ? "opacity-100 transition-opacity duration-500" : "opacity-0 pointer-events-none transition-opacity duration-500"}`}
        >
          <span className="font-semibold text-sm my-auto text-gray-700 py-2">
            You&apos;re currently offline. Please check your Internet
            connection.
          </span>
        </div>
      )}
      <main className="text-white w-full min-h-screen overflow-y-auto flex flex-col justify-center items-center scroll-smooth">
        <ChatAction
          startChatSession={startChatSession}
          handleChatConnection={startChatConnection}
        />
        <ChatMessages
          startChatSession={startChatSession}
          currChatRoom={currChatRoom}
          chatMessages={chatMessages}
          ref={chatContainerRef}
          socket={socket}
          isError={isError}
        />
      </main>
      <ChatInput
        startChatSession={startChatSession}
        handleDisconnectChat={disconnectChat}
        handleSendMessage={handleSendMessage}
        currChatRoom={currChatRoom}
        setNewMessage={setNewMessage}
        newMessage={newMessage}
        socket={socket}
      />
    </>
  );
}
