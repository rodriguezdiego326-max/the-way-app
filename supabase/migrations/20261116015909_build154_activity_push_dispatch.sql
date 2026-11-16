CREATE OR REPLACE FUNCTION private.dispatch_activity_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret text;
BEGIN
  SELECT ds.decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets ds
   WHERE ds.name = 'push_webhook_secret'
   LIMIT 1;

  IF v_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://tmdozaxdvammarxsxjai.supabase.co/functions/v1/push-activity',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object('activity_id', NEW.id),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'activity push dispatch skipped: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.dispatch_activity_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS activity_notifications_push_dispatch ON public.activity_notifications;
CREATE TRIGGER activity_notifications_push_dispatch
  AFTER INSERT ON public.activity_notifications
  FOR EACH ROW EXECUTE FUNCTION private.dispatch_activity_push();