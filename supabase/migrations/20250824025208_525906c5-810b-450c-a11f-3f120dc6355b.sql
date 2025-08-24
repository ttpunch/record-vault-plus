-- Create triggers to automatically capture audit trail data
CREATE TRIGGER records_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.audit_records_trigger();

CREATE TRIGGER reminders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.audit_reminders_trigger();