import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Rocket } from 'lucide-react';
import { addDays, format, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';

interface ScheduleLaunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date) => void;
}

export function ScheduleLaunchModal({
  open,
  onOpenChange,
  onSchedule,
}: ScheduleLaunchModalProps) {
  const minDate = addDays(new Date(), 1);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(minDate));
  const [selectedHour, setSelectedHour] = useState<string>('12');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [isValid, setIsValid] = useState(true);

  // Combine date and time into a single Date object
  const getScheduledDateTime = (): Date | null => {
    if (!selectedDate) return null;
    
    let dateTime = setHours(selectedDate, parseInt(selectedHour));
    dateTime = setMinutes(dateTime, parseInt(selectedMinute));
    return dateTime;
  };

  // Validate that selected datetime is at least 24h from now
  useEffect(() => {
    const scheduledDateTime = getScheduledDateTime();
    if (scheduledDateTime) {
      const minDateTime = addDays(new Date(), 1);
      setIsValid(!isBefore(scheduledDateTime, minDateTime));
    } else {
      setIsValid(false);
    }
  }, [selectedDate, selectedHour, selectedMinute]);

  const handleSchedule = () => {
    const scheduledDateTime = getScheduledDateTime();
    if (scheduledDateTime && isValid) {
      onSchedule(scheduledDateTime);
    }
  };

  const scheduledDateTime = getScheduledDateTime();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">Schedule Your Launch</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Choose when your collection goes live on the marketplace.
            <br />
            <span className="text-muted-foreground text-sm">
              Earliest available: {format(minDate, 'PPP')} at {format(minDate, 'p')}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={{ before: startOfDay(minDate) }}
            initialFocus
            className="rounded-md border"
          />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Time:</span>
            <Select value={selectedHour} onValueChange={setSelectedHour}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={selectedMinute} onValueChange={setSelectedMinute}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['00', '15', '30', '45'].map((min) => (
                  <SelectItem key={min} value={min}>
                    {min}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scheduledDateTime && (
            <div className="text-center p-3 bg-muted rounded-lg w-full">
              <p className="text-sm text-muted-foreground">Your launch will be scheduled for:</p>
              <p className="font-medium text-foreground">
                {format(scheduledDateTime, 'PPP')} at {format(scheduledDateTime, 'p')}
              </p>
              {!isValid && (
                <p className="text-destructive text-sm mt-1">
                  Please select a time at least 24 hours from now
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={!isValid || !selectedDate}
            className="w-full sm:w-auto"
          >
            Schedule Launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
