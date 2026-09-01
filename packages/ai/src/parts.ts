import type { UIDataTypes, UIMessage } from "ai";

export type FloosDataParts = {
  title: { title: string };
};

export type FloosUIMessage = UIMessage<unknown, UIDataTypes & FloosDataParts>;
