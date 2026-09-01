export { FloosChatProvider, useFloosChat } from "./provider";
export { AskFloosInput, ChatReplyInput } from "./components/ask-floos-input";
export { ChatThread } from "./components/chat-thread";
export {
  ChatBackButton,
  ChatHeader,
  ChatNewButton,
  ChatShell,
  ChatTitle,
  ChatView,
} from "./components/chat-view";

import { AskFloosInput, ChatReplyInput } from "./components/ask-floos-input";
import { ChatThread } from "./components/chat-thread";
import {
  ChatBackButton,
  ChatHeader,
  ChatNewButton,
  ChatShell,
  ChatTitle,
  ChatView,
} from "./components/chat-view";
import { FloosChatProvider } from "./provider";

export const FloosChat = {
  Provider: FloosChatProvider,
  Thread: ChatThread,
  Composer: AskFloosInput,
  ReplyComposer: ChatReplyInput,
  View: ChatView,
  Header: ChatHeader,
  Title: ChatTitle,
  NewChat: ChatNewButton,
  Back: ChatBackButton,
  Shell: ChatShell,
};
