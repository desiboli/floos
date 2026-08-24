import { getAllColors } from "@floos/categories";
import { Button } from "@floos/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@floos/ui/components/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@floos/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@floos/ui/components/field";
import { Input } from "@floos/ui/components/input";
import { Textarea } from "@floos/ui/components/textarea";
import { cn } from "@floos/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { useCreateCategory, useUpdateCategory } from "../hooks/use-category-mutations";
import type { CategoryRecord, CategoryTree } from "../services/types";

const nameDescriptionColorSchema = {
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().max(280),
  color: z.string(),
};

const childFormSchema = z.object({
  ...nameDescriptionColorSchema,
  parentId: z.string().min(1, "Choose a parent group"),
});

const parentFormSchema = z.object({
  ...nameDescriptionColorSchema,
  parentId: z.string(),
});

const colorSwatches = getAllColors();

type ParentOption = Pick<CategoryTree, "id" | "name" | "color">;

export function CategoryFormDialog({
  open,
  onOpenChange,
  parents,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parents: ParentOption[];
  category?: CategoryRecord | null;
}) {
  const isEdit = category != null;
  const isParentEdit = isEdit && category.parentId === null;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;

  const form = useForm({
    defaultValues: {
      name: category?.name ?? "",
      parentId: category?.parentId ?? "",
      description: category?.description ?? "",
      color: category?.color ?? "",
    },
    validators: {
      onSubmit: isParentEdit ? parentFormSchema : childFormSchema,
    },
    onSubmit: async ({ value }) => {
      const description = value.description.trim();
      const color = value.color.trim();

      if (isEdit) {
        await updateCategory.mutateAsync({
          id: category.id,
          name: value.name.trim(),
          ...(isParentEdit ? {} : { parentId: value.parentId }),
          description: description.length > 0 ? description : null,
          color: color.length > 0 ? color : null,
        });
      } else {
        await createCategory.mutateAsync({
          name: value.name.trim(),
          parentId: value.parentId,
          ...(description.length > 0 ? { description } : {}),
          ...(color.length > 0 ? { color } : {}),
        });
      }

      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Create category"}</DialogTitle>
          <DialogDescription>
            {isParentEdit
              ? "Change the name, color, or description. The slug stays the same."
              : isEdit
                ? "Change the name, parent, color, or description. The slug stays the same."
                : "Add a child category under an existing group."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="category-form"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Coffee shops"
                      autoComplete="off"
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            {isParentEdit ? null : (
              <form.Field
                name="parentId"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  const selected = parents.find((parent) => parent.id === field.state.value) ?? null;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Parent</FieldLabel>
                      <Combobox
                        items={parents}
                        value={selected}
                        onValueChange={(parent) => field.handleChange(parent?.id ?? "")}
                        itemToStringLabel={(parent) => parent.name}
                        isItemEqualToValue={(a, b) => a.id === b.id}
                      >
                        <ComboboxInput
                          id={field.name}
                          placeholder="Choose a group"
                          aria-invalid={isInvalid}
                          onBlur={field.handleBlur}
                          autoComplete="off"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No groups found</ComboboxEmpty>
                          <ComboboxList>
                            {(parent: ParentOption) => (
                              <ComboboxItem key={parent.id} value={parent}>
                                {parent.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              />
            )}

            <form.Field
              name="description"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional"
                    rows={2}
                  />
                </Field>
              )}
            />

            <form.Subscribe selector={(state) => state.values.parentId}>
              {(parentId) => (
                <form.Field
                  name="color"
                  children={(field) => {
                    const selectedParent = parents.find((parent) => parent.id === parentId);
                    const inherited = selectedParent?.color ?? null;

                    return (
                      <Field>
                        <FieldLabel>Color</FieldLabel>
                        <FieldDescription>
                          {isParentEdit
                            ? "Optional. Used as the default for children that inherit color."
                            : "Leave unset to inherit the parent color."}
                        </FieldDescription>
                        <div className="flex flex-wrap gap-2">
                          {isParentEdit ? null : (
                            <button
                              type="button"
                              onClick={() => field.handleChange("")}
                              className={cn(
                                "flex size-7 items-center justify-center border border-input",
                                field.state.value === "" && "ring-2 ring-ring",
                              )}
                              aria-label="Inherit parent color"
                              title="Inherit parent color"
                            >
                              <span
                                className="size-3.5 rounded-full bg-muted-foreground"
                                style={inherited ? { backgroundColor: inherited } : undefined}
                              />
                            </button>
                          )}
                          {colorSwatches.map((swatch) => (
                            <button
                              key={swatch}
                              type="button"
                              onClick={() => field.handleChange(swatch)}
                              className={cn(
                                "size-7 border border-input",
                                field.state.value === swatch && "ring-2 ring-ring",
                              )}
                              style={{ backgroundColor: swatch }}
                              aria-label={`Color ${swatch}`}
                            />
                          ))}
                        </div>
                      </Field>
                    );
                  }}
                />
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={isPending}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
