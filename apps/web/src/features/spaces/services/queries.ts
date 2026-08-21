import { queryOptions } from "@tanstack/react-query";

import { getSpaces } from "./api";

export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: getSpaces,
  });
