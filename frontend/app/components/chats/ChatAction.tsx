import { Button } from "@components/ui/button";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

type ChatActionProps = {
  startChatSession: boolean;
  handleChatConnection: () => void;
};

export default function ChatAction({
  startChatSession,
  handleChatConnection,
}: ChatActionProps) {
  return (
    <motion.div
      className="mx-auto max-w-3xl flex flex-col justify-center items-center space-y-16"
      animate={startChatSession ? "start" : "end"}
      variants={{
        start: { opacity: 0, pointerEvents: "none", y: -20 },
        end: { opacity: 1, y: 0 },
      }}
    >
      <div className="drop-shadow-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        <ChatBubbleOvalLeftEllipsisIcon className="text-white h-12 w-12 mx-auto" />
        <h1 className="text-5xl md:text-8xl font-bold ">SpareTalk</h1>
      </div>
      <Button
        className="bg-white bg-opacity-20 backdrop-blur-lg shadow-lg hover:bg-transparent font-semibold text-2xl py-8 px-6"
        onClick={handleChatConnection}
      >
        Start Chat
      </Button>
    </motion.div>
  );
}
