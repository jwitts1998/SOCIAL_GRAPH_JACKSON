import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ConversationTask, InsertConversationTask } from "@shared/schema";

const taskFormSchema = z.object({
  taskType: z.enum([
    "user_action",
    "other_commitment",
    "create_contact",
    "schedule_meeting",
    "share_document",
    "request_intro",
    "research",
    "investment_action",
    "relationship",
  ]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedTo: z.enum(["user", "other_participant"]),
  otherParticipantName: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<InsertConversationTask, "conversationId" | "createdBy">) => Promise<void>;
  task?: ConversationTask;
  conversationId: string;
}

const taskTypeOptions = [
  { value: "user_action", label: "Action Item" },
  { value: "other_commitment", label: "Other's Commitment" },
  { value: "create_contact", label: "Create Contact" },
  { value: "schedule_meeting", label: "Schedule Meeting" },
  { value: "share_document", label: "Share Document" },
  { value: "request_intro", label: "Request Introduction" },
  { value: "research", label: "Research" },
  { value: "investment_action", label: "Investment Action" },
  { value: "relationship", label: "Relationship Building" },
];

export default function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  task,
  conversationId,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskType: (task?.taskType as TaskFormValues['taskType']) || "user_action",
      title: task?.title || "",
      description: task?.description || "",
      assignedTo: (task?.assignedTo as "user" | "other_participant") || "user",
      otherParticipantName: task?.otherParticipantName || "",
      priority: (task?.priority as "low" | "medium" | "high") || "medium",
      dueDate: task?.dueDate 
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : "",
    },
  });

  const assignedTo = form.watch("assignedTo");

  useEffect(() => {
    if (task) {
      form.reset({
        taskType: task.taskType as TaskFormValues['taskType'],
        title: task.title,
        description: task.description || "",
        assignedTo: task.assignedTo as "user" | "other_participant",
        otherParticipantName: task.otherParticipantName || "",
        priority: (task.priority as "low" | "medium" | "high") || "medium",
        dueDate: task.dueDate 
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : "",
      });
    } else {
      form.reset({
        taskType: "user_action",
        title: "",
        description: "",
        assignedTo: "user",
        otherParticipantName: "",
        priority: "medium",
        dueDate: "",
      });
    }
  }, [task, open, form]);

  const handleSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        taskType: values.taskType,
        title: values.title,
        description: values.description || null,
        assignedTo: values.assignedTo,
        otherParticipantName: values.assignedTo === "other_participant" 
          ? values.otherParticipantName || null 
          : null,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null as any,
        status: task?.status || "pending",
        linkedContactId: null,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {task 
              ? "Update the task details below."
              : "Add a new actionable item from this conversation."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4">
              <FormField
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taskTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Send follow-up email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details about this task..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Provide additional context or instructions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">You</SelectItem>
                      <SelectItem value="other_participant">Other Participant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {assignedTo === "other_participant" && (
              <FormField
                control={form.control}
                name="otherParticipantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of the other participant" {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the person who committed to this task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

