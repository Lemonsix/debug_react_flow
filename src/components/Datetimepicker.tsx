import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import type { FieldValues, Control, FieldPath } from "react-hook-form";
import { TimestampPicker } from "./Timepicker";

// Definir el tipo que faltaba
interface FormFieldComponentProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  includeTime?: boolean;
  timeFormat?: "12" | "24";
}

export const FormTimestampPicker = <T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled = false,
  className,
  includeTime = false,
  timeFormat = "24",
}: FormFieldComponentProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={`w-full ${className} flex flex-col !gap-y-1`}>
          <FormLabel className="text-sm font-semibold">{label}</FormLabel>
          <FormControl>
            <TimestampPicker
              disabled={disabled}
              includeTime={includeTime}
              timeFormat={timeFormat}
              value={field.value ? new Date(field.value) : undefined}
              onChange={(dateString: string | undefined) => {
                if (dateString) {
                  field.onChange(dateString);
                } else {
                  field.onChange(null);
                }
              }}
              className="w-full py-2 px-3 mb-2 border border-gray-300 rounded-md focus:outline-hidden focus:border-gray-300 placeholder:text-gray-400 text-black bg-white"
            />
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-gray-400">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
