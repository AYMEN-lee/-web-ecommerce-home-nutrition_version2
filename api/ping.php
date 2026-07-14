<?php
/* Keep-alive endpoint — ping this every 10 min from cron-job.org to prevent Railway sleep */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo '{"ok":true}';
