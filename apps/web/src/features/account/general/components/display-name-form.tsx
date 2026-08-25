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
  displayName: z
    .string()
    .min(1, "Display name is required.")
    .max(255, "Display name must be at most 255 characters."),
});

const displayNameHintId = "display-name-hint";

export function DisplayNameForm() {
  const form = useForm({
    defaultValues: {
      displayName: "",
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
        <CardTitle>Display Name</CardTitle>
        <CardDescription>
          Please enter your full name, or a display name you are comfortable with.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="display-name-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="displayName"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name} className="sr-only">
                      Display Name
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      aria-describedby={displayNameHintId}
                      placeholder="John Doe"
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
          <form.Subscribe selector={(state) => state.fieldMeta.displayName}>
            {(meta) => {
              const isInvalid = meta?.isTouched === true && meta?.isValid === false;

              return isInvalid ? (
                <FieldError
                  id={displayNameHintId}
                  className="mr-auto min-w-0"
                  errors={meta.errors}
                />
              ) : (
                <FieldDescription id={displayNameHintId} className="mr-auto min-w-0">
                  Please use 255 characters at maximum.
                </FieldDescription>
              );
            }}
          </form.Subscribe>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="display-name-form">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
