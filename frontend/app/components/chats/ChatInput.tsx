import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { motion } from "framer-motion";
import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { ChatRoom, SocketAuth } from "types/types";

type ChatInputProps = {
  startChatSession: boolean;
  handleDisconnectChat: () => void;
  handleSendMessage: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  currChatRoom: ChatRoom | null;
  newMessage: string;
  setNewMessage: Dispatch<SetStateAction<string>>;
  socket: Socket;
};

export default function ChatInput({
  startChatSession,
  handleDisconnectChat,
  handleSendMessage,
  currChatRoom,
  newMessage,
  setNewMessage,
  socket,
}: ChatInputProps) {
  if (!startChatSession) return null;
  const auth = socket.auth as SocketAuth;
  const chatRoomId = auth?.chatRoomId ? auth?.chatRoomId : "";

  return (
    <motion.div
      className="shadow-lg fixed bottom-0 left-0 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <form
        className="w-full h-full flex items-center bg-[#FCFAFA]"
        onSubmit={(event) => event.preventDefault()}
      >
        <Button
          type="button"
          className="bg-transparent hover:bg-transparent font-bold text-base leading-6 text-rose-500 hover:text-rose-400"
          onClick={handleDisconnectChat}
        >
          Leave
        </Button>
        <Label htmlFor="chatInput" className="sr-only">
          Type your message:, Chat Input
        </Label>
        <Input
          type="text"
          id="chatInput"
          placeholder="Type your message here..."
          className="m-1 text-black text-base leading-6 ring-offset-red-300 bg-[#FCFAFA] border-gray-600/40 focus-visible:ring-transparent focus-visible:ring-offset-0 placeholder:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          onChange={(e) => setNewMessage(e.target.value)}
          value={newMessage}
          onKeyDown={handleSendMessage}
          disabled={currChatRoom?.state === "idle" && chatRoomId !== ""}
        />
      </form>
    </motion.div>
  );
}
