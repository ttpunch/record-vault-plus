import { supabase } from "@/integrations/supabase/client";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminder_date: string;
  reminder_time: string;
  time_limit: string;
  actions: string[];
  is_active: boolean;
  record_id: string;
}

class ReminderService {
  private checkInterval: NodeJS.Timeout | null = null;
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }
  }

  public startReminderChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check for reminders every minute
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60000);

    // Also check immediately
    this.checkReminders();
  }

  public stopReminderChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkReminders() {
    try {
      const now = new Date();
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_active', true)
        .gte('reminder_date', now.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching reminders:', error);
        return;
      }

      if (!reminders) return;

      for (const reminder of reminders) {
        await this.processReminder(reminder, now);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  private async processReminder(reminder: Reminder, now: Date) {
    const reminderDateTime = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
    const timeLimit = this.parseTimeLimit(reminder.time_limit);
    const triggerTime = new Date(reminderDateTime.getTime() - timeLimit);

    // Check if it's time to trigger the reminder
    if (now >= triggerTime && now <= reminderDateTime) {
      await this.triggerReminder(reminder);
    }
  }

  private parseTimeLimit(timeLimit: string): number {
    const timeMap: { [key: string]: number } = {
      "5min": 5 * 60 * 1000,
      "15min": 15 * 60 * 1000,
      "30min": 30 * 60 * 1000,
      "1hour": 60 * 60 * 1000,
      "2hours": 2 * 60 * 60 * 1000,
      "1day": 24 * 60 * 60 * 1000,
      "2days": 2 * 24 * 60 * 60 * 1000,
      "1week": 7 * 24 * 60 * 60 * 1000
    };

    // Handle custom time limits
    if (timeLimit.includes('min')) {
      const minutes = parseInt(timeLimit.replace('min', ''));
      return minutes * 60 * 1000;
    }
    if (timeLimit.includes('hour')) {
      const hours = parseInt(timeLimit.replace('hour', ''));
      return hours * 60 * 60 * 1000;
    }
    if (timeLimit.includes('day')) {
      const days = parseInt(timeLimit.replace('day', ''));
      return days * 24 * 60 * 60 * 1000;
    }

    return timeMap[timeLimit] || 60 * 60 * 1000; // Default to 1 hour
  }

  private async triggerReminder(reminder: Reminder) {
    console.log('Triggering reminder:', reminder.title);

    // Execute reminder actions
    for (const action of reminder.actions) {
      await this.executeAction(action, reminder);
    }
  }

  private async executeAction(action: string, reminder: Reminder) {
    switch (action) {
      case "Show browser notification":
        this.showBrowserNotification(reminder);
        break;
      case "Send email notification":
        await this.sendEmailNotification(reminder);
        break;
      case "Add to calendar":
        this.addToCalendar(reminder);
        break;
      case "Create follow-up task":
        await this.createFollowUpTask(reminder);
        break;
      case "Send Slack notification":
        await this.sendSlackNotification(reminder);
        break;
      case "Create meeting reminder":
        await this.createMeetingReminder(reminder);
        break;
      case "Send WhatsApp message":
        await this.sendWhatsAppMessage(reminder);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  private showBrowserNotification(reminder: Reminder) {
    if (this.notificationPermission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(reminder.title, {
      body: reminder.description || `Reminder for: ${reminder.title}`,
      icon: '/favicon.ico',
      tag: reminder.id,
      requireInteraction: true,
      // Note: Actions are not supported in all browsers
      // actions: [
      //   {
      //     action: 'view',
      //     title: 'View Record'
      //   },
      //   {
      //     action: 'dismiss',
      //     title: 'Dismiss'
      //   }
      // ]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // You could navigate to the specific record here
    };

    // Auto-close after 30 seconds
    setTimeout(() => {
      notification.close();
    }, 30000);
  }

  private async sendEmailNotification(reminder: Reminder) {
    // This would integrate with your email service
    console.log('Sending email notification for:', reminder.title);
    // Implementation depends on your email service (SendGrid, AWS SES, etc.)
  }

  private addToCalendar(reminder: Reminder) {
    const reminderDateTime = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(reminder.title)}&details=${encodeURIComponent(reminder.description || '')}&dates=${reminderDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${reminderDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    
    window.open(calendarUrl, '_blank');
  }

  private async createFollowUpTask(reminder: Reminder) {
    // This would create a follow-up task in your system
    console.log('Creating follow-up task for:', reminder.title);
    // Implementation depends on your task management system
  }

  private async sendSlackNotification(reminder: Reminder) {
    // This would send a Slack notification
    console.log('Sending Slack notification for:', reminder.title);
    // Implementation depends on your Slack integration
  }

  private async createMeetingReminder(reminder: Reminder) {
    // This would create a meeting reminder
    console.log('Creating meeting reminder for:', reminder.title);
    // Implementation depends on your meeting system
  }

  private async sendWhatsAppMessage(reminder: Reminder) {
    // This would send a WhatsApp message
    console.log('Sending WhatsApp message for:', reminder.title);
    // Implementation depends on your WhatsApp integration
  }

  public async getUpcomingReminders(limit: number = 10) {
    try {
      const now = new Date();
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select(`
          *,
          records (
            title,
            category
          )
        `)
        .eq('is_active', true)
        .gte('reminder_date', now.toISOString().split('T')[0])
        .order('reminder_date', { ascending: true })
        .order('reminder_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return reminders || [];
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      return [];
    }
  }
}

export const reminderService = new ReminderService();
