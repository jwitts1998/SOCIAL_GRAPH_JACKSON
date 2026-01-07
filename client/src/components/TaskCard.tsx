import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  X, 
  Clock, 
  Edit, 
  Trash2, 
  Archive,
  User,
  Users,
  Calendar,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import type { ConversationTask } from "@shared/schema";

interface TaskCardProps {
  task: ConversationTask;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onArchive?: () => void;
  onStatusChange?: (status: string) => void;
  isPending?: boolean;
}

const taskTypeLabels: Record<string, string> = {
  user_action: "Action",
  other_commitment: "Commitment",
  create_contact: "New Contact",
  schedule_meeting: "Meeting",
  share_document: "Document",
  request_intro: "Introduction",
  research: "Research",
  investment_action: "Investment",
  relationship: "Relationship",
};

const taskTypeColors: Record<string, string> = {
  user_action: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  other_commitment: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  create_contact: "bg-green-500/10 text-green-600 dark:text-green-400",
  schedule_meeting: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  share_document: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  request_intro: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  research: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  investment_action: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  relationship: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-destructive/20 text-destructive",
};

const statusColors: Record<string, string> = {
  pending: "",
  in_progress: "bg-primary/5 border-primary/20",
  completed: "bg-green-500/10 border-green-500/20 opacity-75",
  archived: "bg-muted/50 opacity-50",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  in_progress: <Clock className="w-3.5 h-3.5 text-primary" />,
  completed: <Check className="w-3.5 h-3.5 text-green-600" />,
  archived: <Archive className="w-3.5 h-3.5 text-muted-foreground" />,
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onArchive,
  onStatusChange,
  isPending = false,
}: TaskCardProps) {
  const cardClassName = `p-4 space-y-3 ${statusColors[task.status] || ''}`;
  const isCompleted = task.status === 'completed';
  const isArchived = task.status === 'archived';

  return (
    <Card className={cardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={taskTypeColors[task.taskType] || "bg-muted"}
            >
              {taskTypeLabels[task.taskType] || task.taskType}
            </Badge>
            {task.status !== 'pending' && statusIcons[task.status]}
            <Badge 
              variant="outline" 
              className={priorityColors[task.priority || 'medium']}
            >
              {task.priority || 'medium'}
            </Badge>
          </div>
          
          <h4 className="text-base font-semibold mb-1">
            {task.title}
          </h4>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              {task.assignedTo === 'user' ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              <span>
                {task.assignedTo === 'user' 
                  ? 'You' 
                  : task.otherParticipantName || 'Other participant'}
              </span>
            </div>
            
            {task.dueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
                {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {!isArchived && (
        <>
          <Separator />
          <div className="flex gap-2">
            {task.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange?.('in_progress')}
                  className="flex-1"
                  disabled={isPending}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Start
                </Button>
                <Button
                  size="sm"
                  onClick={onComplete}
                  className="flex-1"
                  disabled={isPending}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Complete
                </Button>
              </>
            )}
            
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={onComplete}
                className="flex-1"
                disabled={isPending}
              >
                <Check className="w-3 h-3 mr-1" />
                Complete
              </Button>
            )}
            
            {task.status === 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onArchive}
                className="flex-1"
                disabled={isPending}
              >
                <Archive className="w-3 h-3 mr-1" />
                Archive
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              disabled={isPending}
            >
              <Edit className="w-3 h-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={isPending}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </>
      )}
      
      {isArchived && (
        <div className="text-xs text-muted-foreground italic">
          Archived {task.archivedAt && format(new Date(task.archivedAt), 'MMM d, yyyy')}
        </div>
      )}
    </Card>
  );
}

