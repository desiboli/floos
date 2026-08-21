import { createRoute, z } from "@hono/zod-openapi";

import * as HTTPStatusCodes from "../../http-status-codes";
import jsonContent from "../../openapi/helpers/json-content";

const tags = ["Examples"];

export const taskSchema = z.object({
  name: z.string(),
  done: z.boolean(),
});

export const taskWithIdSchema = taskSchema.extend({
  id: z.string(),
});

export const taskIdParamSchema = z.object({
  id: z.string().min(1),
});

export const patchTaskSchema = z.object({
  name: z.string().optional(),
  done: z.boolean().optional(),
});

export const deleteTaskSchema = z.object({
  deleted: z.literal(true),
  id: z.string(),
});

export const list = createRoute({
  tags,
  path: "/example",
  method: "get",
  summary: "List example tasks",
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(z.array(taskWithIdSchema), "The list of tasks"),
  },
});

export type ListRoute = typeof list;

export const put = createRoute({
  tags,
  path: "/example/{id}",
  method: "put",
  summary: "Replace an example task",
  request: {
    params: taskIdParamSchema,
    body: {
      ...jsonContent(taskSchema, "The task to store"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(taskWithIdSchema, "The replaced task"),
  },
});

export type PutRoute = typeof put;

export const patch = createRoute({
  tags,
  path: "/example/{id}",
  method: "patch",
  summary: "Update an example task",
  request: {
    params: taskIdParamSchema,
    body: {
      ...jsonContent(patchTaskSchema, "The task fields to update"),
      required: true,
    },
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(taskWithIdSchema, "The updated task"),
  },
});

export type PatchRoute = typeof patch;

export const remove = createRoute({
  tags,
  path: "/example/{id}",
  method: "delete",
  summary: "Delete an example task",
  request: {
    params: taskIdParamSchema,
  },
  responses: {
    [HTTPStatusCodes.OK]: jsonContent(deleteTaskSchema, "The deleted task id"),
  },
});

export type RemoveRoute = typeof remove;
