import { Button } from "@floos/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@floos/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@floos/ui/components/field";
import { Input } from "@floos/ui/components/input";
import { toast } from "@floos/ui/components/toast";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const formSchema = z.object({
  spaceName: z
    .string()
    .min(3, "Space name must be at least 3 characters.")
    .max(32, "Space name must be at most 32 characters."),
});

const spaceNameHintId = "space-name-hint";

export function SpaceNameForm() {
  const form = useForm({
    defaultValues: {
      spaceName: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.add({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-code p-4 text-code-foreground">
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Space Name</CardTitle>
        <CardDescription>
          Set the name of your space. This will be used to identify your space in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="space-name-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="spaceName"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name} className="sr-only">
                      Space Name
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      aria-describedby={spaceNameHintId}
                      placeholder="My Space"
                      autoComplete="off"
                    />
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="justify-end">
          <form.Subscribe selector={(state) => state.fieldMeta.spaceName}>
            {(meta) => {
              const isInvalid = meta?.isTouched === true && meta?.isValid === false;

              return isInvalid ? (
                <FieldError id={spaceNameHintId} className="mr-auto min-w-0" errors={meta.errors} />
              ) : (
                <FieldDescription id={spaceNameHintId} className="mr-auto min-w-0">
                  Please use 32 characters at maximum.
                </FieldDescription>
              );
            }}
          </form.Subscribe>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="space-name-form">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
