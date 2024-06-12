import { motion } from "framer-motion";
import { ForwardedRef, forwardRef } from "react";
import { Socket } from "socket.io-client";
import { ChatMessage, ChatRoom, SocketAuth } from "types/types";

type ChatMessagesProps = {
  startChatSession: boolean;
  currChatRoom: ChatRoom | null;
  chatMessages: ChatMessage[];
  socket: Socket;
  isError: { isError: boolean; errorMessage: string };
};

export default forwardRef(function ChatMessages(
  {
    startChatSession,
    currChatRoom,
    chatMessages,
    socket,
    isError,
  }: ChatMessagesProps,
  ref: ForwardedRef<HTMLQuoteElement | null>,
) {
  if (!startChatSession) return null;
  const auth = socket.auth as SocketAuth;
  const socketSessionId = auth?.sessionId ? auth?.sessionId : socket.id;
  const chatRoomId = auth?.chatRoomId ? auth?.chatRoomId : null;

  return (
    <motion.blockquote
      ref={ref}
      className="bg-white bg-opacity-20 backdrop-blur-lg p-8 rounded-t-lg shadow-lg max-w-[32rem] w-full flex-grow relative bottom-[48px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="text-center leading-6">
        Searching for someone to chat...
      </div>
      {chatRoomId && (
        <div className="text-center leading-6 p-2">
          Connection completed, start to chat!
        </div>
      )}
      {chatMessages.map((message, i) => {
        return socketSessionId === message.sender ? (
          <div
            key={i}
            className="my-1 py-2 px-4 bg-purple-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl text-white float-right clear-both max-w-md break-words"
          >
            <span className="sr-only">Me: </span>
            {message.message}
          </div>
        ) : (
          <div
            key={i}
            className="leading-7 my-1 py-2 px-4 bg-purple-400 rounded-br-3xl rounded-tr-3xl rounded-tl-xl text-white float-left clear-both max-w-md break-words"
          >
            <span className="sr-only">Stranger: </span>
            {message.message}
          </div>
        );
      })}
      {currChatRoom && currChatRoom.state === "idle" && (
        <div className="text-center leading-6 p-2 clear-both">
          The other person has left the chat, please click on Leave button back
          to homepage.
        </div>
      )}
      {isError.isError && (
        <div className="text-center leading-6 p-2 clear-both">
          {isError.errorMessage}
        </div>
      )}
    </motion.blockquote>
  );
});
