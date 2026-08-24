export type BaseCategory = {
  slug: string;
  name: string;
  color: string;
  system: boolean;
  excluded: boolean;
};

export type ChildCategory = BaseCategory & {
  parentSlug: string;
};

export type ParentCategory = BaseCategory & {
  children: ChildCategory[];
};

export type CategoryHierarchy = ParentCategory[];
